import cheerio, { Cheerio } from "cheerio";
import { isEmpty } from "class-validator";
import { ICourse, IParser } from "../interfaces";
import { CourseModel } from "../models";
import { get, post } from "../utils/request";
import { objectToQueryString } from "../utils/urlencoder";
import config from "../config";
import { courseraCategoryMap, courseraDurationMap, udemyCategoryMap } from "./CategoryMap";

const gc = require("expose-gc/function");
let count = 0;
export class CourseraParser implements IParser {
	public static async getCoursesByCategory(categoryId: number,
											 categoryName: string,
											 duration: string,
											 durationName: string) {

		const params: { [k: string]: any } = {};

		categoryName = encodeURIComponent(categoryName);
		durationName = encodeURIComponent(durationName);
		let url = "https://lua9b20g37-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%20(lite)%203.30.0%3Breact-instantsearch%205.2.3%3BJS%20Helper%202.26.1&x-algolia-application-id=LUA9B20G37&x-algolia-api-key=dcc55281ffd7ba6f24c3a9b18288499b",
			body = {
				"requests": [
					{
						"indexName": "prod_all_products_term_optimization",
						"params": "query=&hitsPerPage=1000&maxValuesPerFacet=1000&page=0&highlightPreTag=%3Cais-highlight-0000000000%3E&highlightPostTag=%3C%2Fais-highlight-0000000000%3E&clickAnalytics=true&ruleContexts=%5B%22ru%22%5D&facets=%5B%22isPartOfCourseraPlus%22%2C%22allLanguages%22%2C%22productDifficultyLevel%22%2C%22productDurationEnum%22%2C%22topic%22%2C%22skills%22%2C%22partners%22%2C%22entityTypeDescription%22%5D&tagFilters=&facetFilters=%5B%5B%22topic%3A" + categoryName + "%22%5D%2C%5B%22productDurationEnum%3A" + durationName + "%22%5D%5D"
					}
				]
			};


		let promise = Promise.resolve();

		let courses: ICourse[] = [];
		promise = promise.then(function() {
			return new Promise(async function(resolve) {
				await post(url, { "Content-Type": "application/json" }, "json", body).then(
					(data) => {
						const result = data.results[0];
						for (let course of result.hits) {
							if (course) {
								const courseData: ICourse = {
									id: "coursera_" + course.objectID,
									courseName: course.name,
									description: "description",
									shortDescription: course._snippetResult.description.value,
									link: "https://www.coursera.org" + course.objectUrl,
									previewImageLink: course.imageUrl,
									vendor: {
										id: "coursera",
										name: "Coursera",
										link: "https://www.coursera.org/",
										icon: "https://api.mooc.ij.je/public_files/img/vendors/coursera.png"
									},
									author: {
										name: course.partners[0],
										link: "https://www.coursera.org/",
										icon: course.partnerLogos[0]
									},
									duration: duration,
									courseLanguages: course.allLanguageCodes,
									rating: {
										external: {
											"averageScore": parseFloat(course.avgProductRating?.toFixed(2)) ?? 0,
											"countReviews": course.numProductRatings ?? 0
										},
										internal: {
											"averageScore": 0,
											"countReviews": 0
										}
									},
									categories: [categoryId],
									price: {
										amount: 0,
										currency: "RUB"
									},
									countViews: 0
								};
								courses.push(courseData);
							}
						}
					},
					(err) => {
						console.log(
							"Coursera request error at category " + categoryName + ": " + err.stack
						);
					}
				);
				resolve();
			});
		});

		return promise.then(function() {
			return courses;
		});

	}

	public static parseCoursePages(courses: ICourse[], saveToDB = false) {
		let promise = Promise.resolve();

		for (let course of courses) {
			promise = promise.then(function() {
				return new Promise(async function(resolve) {
					await setTimeout(() => resolve(), 700);
					await CourseraParser.parseCoursePage(course)
						.then((updatedCourse) => {
							count += 1;
							console.log(course.id + ": parsed, current count: " + count);
							if (saveToDB) {
								CourseModel.findOne({ id: updatedCourse.id })
									.then((existingCourse) => {
										if (existingCourse) {
											updatedCourse.rating.internal = existingCourse.rating.internal;
											updatedCourse.countViews = existingCourse.countViews;
										}
										CourseModel.updateOne(
											{ id: updatedCourse.id },
											{ $set: updatedCourse },
											{ upsert: true }).exec();
									});
							}
						})
						.catch((err) => {
							console.log("Coursera request error at course " + course.id + ": " + err.stack);
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
				const description = $(".about-section > div > div > p");

				function getTextFromParagraphs(node: cheerio.Cheerio) {
					let str = "";
					node.each(function(this: cheerio.Cheerio, i, elem) {
						const txt = $(this).text();
						str += txt + "\n";
					});
					return str.replace(/\\n+/g, "\n");
				}

				course.description = getTextFromParagraphs(description);

				const script = cheerio.html($('#rendered-content').next());
				const dataState = JSON.parse(script.match(/window.__APOLLO_STATE__ = ({.*});/)![1]);
				console.log(course.link);
				let obj = dataState["XdpV1_org_coursera_xdp_sdp_SDPMetadata:" + course.id.match(/(.*)~(.*)/)![2]];
				console.log("XdpV1_org_coursera_xdp_sdp_SDPMetadata:" + course.id.match(/(.*)~(.*)/)![2])
				if (obj == undefined) {
					obj = dataState["XdpV1_org_coursera_xdp_cdp_CDPMetadata:" + course.id.match(/(.*)~(.*)/)![2]];
				}

				const instructor = dataState[obj["instructors"][0].id];
				course.author.name = instructor.fullName;
				course.author.icon = instructor.photo;
				course.author.link = "https://www.coursera.org/instructor/~" + instructor.id;

				return course;
			},
			(err) => {
				console.log(
					"Coursera parse error at " + course.id + ": " + err.stack
				);
				return course;
			}
		);
	}

	public parseCourses(saveToDB = false): Promise<any> {

		//dataCourses = dataGroups = dataUni = dataCovers = undefined;
		gc();

		let promise = Promise.resolve();

		for (let categoryName in courseraCategoryMap) {
			for (let duration in courseraDurationMap) {
				promise = promise.then(function() {
					console.log(categoryName);
					return new Promise(async function(resolve) {
						await CourseraParser.getCoursesByCategory(
							courseraCategoryMap[categoryName],
							categoryName,
							courseraDurationMap[duration],
							duration)
							.then(async (courses) => {
								await CourseraParser.parseCoursePages(courses, saveToDB);
								resolve();
							});
					});
				});
			}
		}

		return promise.then(function() {
			return true;
		});
	}
}

export const courseraParser = new CourseraParser();
