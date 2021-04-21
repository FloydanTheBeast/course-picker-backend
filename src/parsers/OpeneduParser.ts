import {IParser} from "../interfaces";
import {ICourseDocument} from "../models/course";
import {CourseModel} from "../models";
import {get} from "../utils/request";
import cheerio from "cheerio";
import {isEmpty} from "class-validator";
const gc = require('expose-gc/function');

class OpeneduParser implements IParser {
	public parseCourses(saveToDB: boolean = false): Promise<ICourseDocument[]> {
		return get("https://openedu.ru/course/").then(
			data => {
				let $ = cheerio.load(data);
				let script = "";

				$('script:not([src])').toArray().forEach(x => {
					let html: string = cheerio.html(x);
					if (html.includes("COURSES") && html.includes("COVERS")) {
						script = html;
					}
				});

				let dataCourses = JSON.parse(script.match(/COURSES = ({.*});/)![1]),
					dataUni = JSON.parse(script.match(/UNIVERSITIES = ({.*});/)![1]),
					dataGroups = JSON.parse(script.match(/GROUPS = ({.*});/)![1]),
					dataCovers = JSON.parse(script.match(/COVERS = ({(.|\r|\n)*?});/)![1]
						.replace(/[ \n\r]+/g, ' ')
						.replace(/'/g, '"'));

				let courses: ICourseDocument[] = [];
				for (let key in dataCourses) {
					let groups = [], courseGroups = dataCourses[key]['groups'];

					for (let i = 0; i < courseGroups.length; i++)
						if (dataGroups.hasOwnProperty(courseGroups[i]))
							groups.push(dataGroups[courseGroups[i]]);

					let courseData = {
						id: "openedu_" + key,
						courseName: dataCourses[key]["title"],
						description: "description",
						shortDescription: "shortDescription",
						link: "https://openedu.ru" + dataCourses[key]['url'],
						previewImageLink: dataCovers[key],
						vendor: "openedu",
						author: {
							name: dataUni[dataCourses[key]["uni"]]["abbr"],
							link: "https://openedu.ru" + dataUni[dataCourses[key]["uni"]]["url"],
							icon: dataUni[dataCourses[key]["uni"]]["icon"],
						},
						duration: dataCourses[key]['weeks'] + "w",
						courseLanguages: ["ru"],
						groups: groups,
						price: 0,
					}
					const course = new CourseModel(courseData);
					courses.push(course);
				}

				dataCourses = dataGroups = dataUni = dataCovers = undefined;
				gc();

				let promise = Promise.resolve();

				courses.forEach(function (course) {
					promise = promise.then(function () {
						return new Promise(async function (resolve) {
								await setTimeout(() => resolve(), 300);
								await parseDescription(course).then(
									updatedCourse => {
										console.log(course.id + ": parsed")
										course = updatedCourse;
										if (saveToDB)
											course.save();
									});
								//console.log(course.id + ": resolved");
								//resolve();
							}
						);
					});
				});

				return promise.then(function () {
					return courses;
				});
			}
		);
	}
}

function parseDescription(course: ICourseDocument) {
	let url = course.link;
	return get(url).then(
		data => {
			let $ = cheerio.load(data);
			let description = $('.description');

			function getTextFromParagraphs(node: cheerio.Cheerio) {
				let str = "";
				node.each(function (this: cheerio.Cheerio, i, elem) {
					let txt = $(this).text();
					str += txt + "\n";
				});
				return str;
			}

			course.description = getTextFromParagraphs($('#about').nextUntil('#course_format, h2'));
			if (isEmpty(course.description))
				course.description = "Error Description";

			if (description.length > 0)
				course.shortDescription = description.children('p').text();
			else
				course.shortDescription = course.description.split('.')[0] + ".";

			let videoModal = $('[data-target="#videoModal"]');
			let previewLink = videoModal.children('img').attr('src');
			let previewLink2 = videoModal.children('.wrap').children('img').attr('src');
			if (course.previewImageLink == undefined)
				if (previewLink != undefined)
					course.previewImageLink = previewLink;
				else if (previewLink2 != undefined)
					course.previewImageLink = previewLink2;
				else
					course.previewImageLink = 'https://cdn.openedu.ru/fd95ff/8117f42b/img/course-image2.jpg';

			return course;
		},
		err => {
			console.log("Openedu parse error at " + course.id + ": " + err.stack);
			return course;
		});
}

export const openeduParser = new OpeneduParser();