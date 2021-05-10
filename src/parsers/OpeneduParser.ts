import cheerio from "cheerio";
import { isEmpty } from "class-validator";
import { ICourse, IParser } from "../interfaces";
import { CourseModel } from "../models";
import { get } from "../utils/request";
import { openeduCategoryMap } from "./CategoryMap";

const gc = require("expose-gc/function");

export class OpeneduParser implements IParser {
	public parseCourses(saveToDB = false): Promise<ICourse[]> {
		return get("https://openedu.ru/course/").then((data) => {
			const $ = cheerio.load(data);
			let script = "";

			$("script:not([src])")
				.toArray()
				.forEach((x) => {
					const html: string = cheerio.html(x);
					if (html.includes("COURSES") && html.includes("COVERS")) {
						script = html;
					}
				});

			let dataCourses = JSON.parse(script.match(/COURSES = ({.*});/)![1]),
				dataUni = JSON.parse(
					script.match(/UNIVERSITIES = ({.*});/)![1]
				),
				dataGroups = JSON.parse(script.match(/GROUPS = ({.*});/)![1]),
				dataCovers = JSON.parse(
					script
						.match(/COVERS = ({(.|\r|\n)*?});/)![1]
						.replace(/[ \n\r]+/g, " ")
						.replace(/'/g, "\"")
				);

			const courses: ICourse[] = [];
			for (const key in dataCourses) {
				let categories: Set<number> = new Set<number>();
				const courseGroups: string[] = dataCourses[key]["groups"];

				for (let i = 0; i < courseGroups.length; i++) {
					if (openeduCategoryMap.hasOwnProperty(courseGroups[i])) {
						categories.add(openeduCategoryMap[courseGroups[i]]);
					}
				}

				const courseData: ICourse = {
					id: "openedu_" + key,
					courseName: dataCourses[key]["title"],
					description: "description",
					shortDescription: "shortDescription",
					link: "https://openedu.ru" + dataCourses[key]["url"],
					previewImageLink: dataCovers[key],
					vendor: {
						id: "openedu",
						name: "OpenEdu",
						link: "https://openedu.ru/",
						icon : "https://api.mooc.ij.je/public_files/img/vendors/openedu.png",
					},
					author: {
						name: dataUni[dataCourses[key]["uni"]]["abbr"],
						link:
							"https://openedu.ru" +
							dataUni[dataCourses[key]["uni"]]["url"],
						icon: dataUni[dataCourses[key]["uni"]]["icon"]
					},
					duration: dataCourses[key]["weeks"] + "w",
					courseLanguages: ["ru"],
					categories: [...categories],
					price: {
						amount: 0,
						currency: "RUB"
					},
					rating: {
						external: {
							"averageScore": 0,
							"countReviews": 0
						},
						internal : {
							"averageScore" : 0,
							"countReviews" : 0
						}
					},
					countViews: 0
				};
				courses.push(courseData);
			}

			dataCourses = dataGroups = dataUni = dataCovers = undefined;
			gc();

			let promise = Promise.resolve();

			courses.forEach(function(course) {
				promise = promise.then(function() {
					return new Promise(async function(resolve) {
						await setTimeout(() => resolve(), 150);
						await OpeneduParser.parseDescription(course)
							.then((updatedCourse) => {
								course = updatedCourse;
								console.log(course.id + ": parsed");
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
							});
					});
				});
			});

			return promise.then(function() {
				return courses;
			});
		});
	}

	public static parseDescription(course: ICourse) {
		const url = course.link;
		return get(url).then(
			(data) => {
				const $ = cheerio.load(data);
				const description = $(".description");

				function getTextFromParagraphs(node: cheerio.Cheerio) {
					let str = "";
					node.each(function(this: cheerio.Cheerio, i, elem) {
						const txt = $(this).text();
						str += txt + "\n";
					});
					return str;
				}

				course.description = getTextFromParagraphs(
					$("#about").nextUntil("#course_format, h2")
				);
				if (isEmpty(course.description)) {
					course.description = "Error Description";
				}

				if (description.length > 0) {
					course.shortDescription = description.children("p").text();
				} else {
					course.shortDescription =
						course.description.split(".")[0] + ".";
				}

				const videoModal = $("[data-target=\"#videoModal\"]");
				const previewLink = videoModal.children("img").attr("src");
				const previewLink2 = videoModal
					.children(".wrap")
					.children("img")
					.attr("src");
				if (course.previewImageLink == undefined) {
					if (previewLink != undefined) {
						course.previewImageLink = previewLink;
					} else if (previewLink2 != undefined) {
						course.previewImageLink = previewLink2;
					} else {
						course.previewImageLink =
							"https://cdn.openedu.ru/fd95ff/8117f42b/img/course-image2.jpg";
					}
				}

				return course;
			},
			(err) => {
				console.log(
					"Openedu parse error at " + course.id + ": " + err.stack
				);
				return course;
			}
		);
	}
}

export const openeduParser = new OpeneduParser();
