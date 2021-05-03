import cheerio, { Cheerio } from "cheerio";
import { isEmpty } from "class-validator";
import { ICourse, IParser } from "../interfaces";
import { CourseModel } from "../models";
import { get } from "../utils/request";
import { objectToQueryString } from "../utils/urlencoder";
import config from "../config";
import { udemyCategoryMap } from "./CategoryMap";

const gc = require("expose-gc/function");

export class UdemyParser implements IParser {
	public parseCourses(saveToDB = false): Promise<any> {


		//dataCourses = dataGroups = dataUni = dataCovers = undefined;
		gc();

		let promise = Promise.resolve();

		for (let categoryName in udemyCategoryMap) {
			promise = promise.then(function() {
				console.log(categoryName);
				return new Promise(async function(resolve) {
					await UdemyParser.getCoursesByCategory(udemyCategoryMap[categoryName], categoryName)
						.then(async (courses) => {
							await UdemyParser.parseCoursePages(courses, saveToDB);
							resolve();
						});
				});
			});
		}

		return promise.then(function() {
			return true;
		});
	}

	public static async getCoursesByCategory(category: { [k: string]: any }, categoryName: string) {
		const subCategory = category.subcategory,
			categoryId = category.categoryId;

		const params: { [k: string]: any } = {};

		let url = "https://www.udemy.com/api-2.0/courses/?",
			headers = { Authorization: config.parseTokens.udemyAuthHeader };

		// Define parameters
		params.page_size = 10000;
		params.page = 1;
		if (subCategory) {
			params.subcategory = categoryName;
		} else {
			params.category = categoryName;
		}

		// Construct url
		url += objectToQueryString(params);

		let promise = Promise.resolve();

		let next: any = null;
		let courses: ICourse[] = [];
		do {
			promise = promise.then(function() {
				return new Promise(async function(resolve) {
					await get(url, headers).then(
						(data) => {
							const body = JSON.parse(data);
							next = body.next;
							console.log(next);
							url = next;
							for (let course of body.results) {
								if (course["visible_instructors"][0]) {
									const courseData: ICourse = {
										id: "udemy_" + course.id,
										courseName: course.title,
										description: "description",
										shortDescription: course.headline,
										link: "https://www.udemy.com" + course.url,
										previewImageLink: course["image_480x270"],
										vendor: {
											id: "udemy",
											name: "Udemy",
											link: "https://www.udemy.com/",
											icon : "https://mooc.ij.je/public_files/img/vendors/udemy.png",
										},
										author: {
											name: course["visible_instructors"][0].title,
											link: "https://www.udemy.com/" + course["visible_instructors"][0].url,
											icon: course["visible_instructors"][0]["image_100x100"]
										},
										duration: "0s",
										courseLanguages: [],
										rating: {
											external: {
												"averageScore": 0,
												"countReviews": 0
											},
											internal: {
												"averageScore": 0,
												"countReviews": 0
											}
										},
										categories: [categoryId],
										price: {
											amount: course["price_detail"].amount,
											currency: course["price_detail"].currency
										}
									};
									courses.push(courseData);
								}
							}
						},
						(err) => {
							console.log(
								"Udemy request error at category " + categoryName + ": " + err.stack
							);
						}
					);
					resolve();
				});
			});

			await promise;
		}
		while (next != null);

		return promise.then(function() {
			return courses;
		});

	}

	public static parseCoursePages(courses: ICourse[], saveToDB = false) {
		let promise = Promise.resolve();

		for (let course of courses) {
			promise = promise.then(function() {
				return new Promise(async function(resolve) {
					await setTimeout(() => resolve(), 50);
					await UdemyParser.parseCoursePage(course)
						.then((updatedCourse) => {
							console.log(course.id + ": parsed");
							if (saveToDB) {
								CourseModel.findOne({ id: updatedCourse.id })
									.then((existingCourse) => {
										if (existingCourse) {
											updatedCourse.rating.internal = existingCourse.rating.internal;
										}
										CourseModel.updateOne(
											{ id: updatedCourse.id },
											{ $set: updatedCourse },
											{ upsert: true }).exec();
									});
							}
						})
						.catch((err) => {
							console.log("Udemy request error at course " + course.id + ": " + err.stack)
						});
				});
			});
		}

		return promise.then(function() {
			return true;
		});
	}

	public static parseCoursePage(course: ICourse) {
		const url = course.link;
		return get(url).then(
			(data) => {
				const $ = cheerio.load(data);

				// Get description
				const description = $("[data-purpose=\"safely-set-inner-html:description:description\"]");

				function getTextFromParagraphs(node: cheerio.Cheerio) {
					let str = "";
					node.each(function(this: cheerio.Cheerio, i, elem) {
						const txt = $(this).text();
						str += txt + "\n";
					});
					return str;
				}

				course.description = getTextFromParagraphs(description);
				if (isEmpty(course.description)) {
					course.description = "Error Description";
				}

				// Get languages
				const json_schema = JSON.parse($("#schema_markup").children('script')
					// @ts-ignore
					.get()[0].children[0].data.trim());
				course.courseLanguages.push(json_schema[0].inLanguage);

				// Get duration
				const props = JSON.parse($('.ud-component--course-landing-page-udlite--curriculum')
					.get()[0].attribs["data-component-props"]);
				const seconds = props["estimated_content_length_in_seconds"];

				if (seconds)
					course.duration = seconds + "s";
				else
					course.duration = "0s";


				// Get external rating
				const ratingData = JSON.parse($('.ud-component--course-landing-page-udlite--rating')
					.get()[0].attribs["data-component-props"]);
				course.rating.external["averageScore"] = ratingData.rating;
				course.rating.external["countReviews"] = ratingData["num_reviews"];

				return course;
			},
			(err) => {
				console.log(
					"Udemy parse error at " + course.id + ": " + err.stack
				);
				return course;
			}
		);
	}
}

export const udemyParser = new UdemyParser();
