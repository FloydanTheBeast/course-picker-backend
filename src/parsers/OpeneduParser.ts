import cheerio from "cheerio";
import { isEmpty } from "class-validator";
import { ICourse, IParser } from "../interfaces";
import { CourseModel } from "../models";
import { ICourseDocument } from "../models/course";
import { get } from "../utils/request";
import Category from "../models/category";

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
				let categories : Set<number> = new Set<number>();
				const courseGroups : string[] = dataCourses[key]["groups"];

				for (let i = 0; i < courseGroups.length; i++) {
					if (categoryMap.hasOwnProperty(courseGroups[i])) {
						categories.add(categoryMap[courseGroups[i]]);
					}
				}

				const courseData : ICourse = {
					id: "openedu_" + key,
					courseName: dataCourses[key]["title"],
					description: "description",
					shortDescription: "shortDescription",
					link: "https://openedu.ru" + dataCourses[key]["url"],
					previewImageLink: dataCovers[key],
					vendor: "openedu",
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
						amount : 0,
						currency : "RUB",
					}
				};
				courses.push(courseData);
			}

			dataCourses = dataGroups = dataUni = dataCovers = undefined;
			gc();

			let promise = Promise.resolve();

			courses.forEach(function(course) {
				promise = promise.then(function() {
					return new Promise(async function(resolve) {
						await setTimeout(() => resolve(), 200);
						await OpeneduParser.parseDescription(course)
							.then((updatedCourse) => {
								course = updatedCourse;
								console.log(course.id + ": parsed");
								if (saveToDB) {
									CourseModel.updateOne(
										{ id: course.id },
										{ $set: course },
										{ upsert: true }).exec();
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

const categoryMap : { [k: string]: number } = {
	'1': 10,
	'2': 4,
	'3': 7,
	'4': 7,
	'5': 7,
	'6': 7,
	'7': 8,
	'8': 8,
	'9': 8,
	'10': 8,
	'11': 8,
	'12': 8,
	'13': 8,
	'14': 8,
	'15': 8,
	'16': 8,
	'17': 8,
	'18': 8,
	'19': 8,
	'20': 8,
	'21': 8,
	'22': 8,
	'23': 13,
	'24': 7,
	'25': 7,
	'26': 7,
	'27': 7,
	'28': 7,
	'29': 7,
	'30': 7,
	'31': 7,
	'32': 7,
	'33': 7,
	'34': 7,
	'35': 7,
	'36': 7,
	'37': 7,
	'38': 7,
	'39': 7,
	'40': 7,
	'41': 7,
	'42': 7,
	'43': 7,
	'44': 7,
	'45': 7,
	'46': 7,
	'47': 8,
	'48': 8,
	'49': 8,
	'50': 7,
	'52': 8,
	'53': 8,
	'54': 8,
	'55': 8,
	'56': 7,
	'57': 8,
	'58': 7,
	'59': 7,
	'60': 8,
	'61': 8,
	'62': 8,
	'63': 8,
	'64': 8,
	'65': 6,
	'66': 8,
	'67': 8,
	'68': 8,
	'69': 8,
	'72': 8,
	'73': 8,
	'74': 8,
	'75': 8,
	'76': 8,
	'77': 8,
	'79': 8,
	'80': 8,
	'81': 8,
	'82': 8,
	'83': 8,
	'84': 8,
	'88': 8,
	'90': 10,
	'91': 8,
	'92': 8,
	'93': 8,
	'95': 8,
	'96': 8,
	'97': 7,
	'98': 7,
	'99': 8,
	'100': 8,
	'101': 1,
	'102': 8,
	'104': 8,
	'105': 7,
	'106': 7,
	'107': 7,
	'108': 7,
	'109': 7,
	'110': 8,
	'113': 10,
	'116': 7,
	'117': 8,
	'118': 8,
	'120': 7,
	'121': 2,
	'122': 8,
	'123': 10,
	'125': 7,
	'126': 7,
	'127': 7,
	'128': 7,
	'129': 7,
	'130': 7,
	'131': 7,
	'132': 7,
	'133': 7,
	'134': 8,
	'135': 7,
	'136': 4,
	'137': 10,
	'139': 8,
	'140': 4,
	'141': 4,
	'142': 7,
	'143': 8,
	'144': 8,
	'145': 8,
	'146': 8,
	'147': 8,
	'148': 3,
	'149': 4,
	'150': 8,
	'151': 4,
	'152': 7,
	'153': 7,
	'154': 7,
	'155': 7,
	'156': 7,
	'159': 4,
	'160': 4,
	'161': 4,
	'162': 10,
	'164': 7,
	'165': 4,
	'166': 7,
	'167': 7,
	'168': 7,
	'170': 10,
	'171': 7,
	'172': 8,
	'173': 7,
	'174': 7,
	'175': 7,
	'176': 8,
	'177': 10,
	'178': 10,
	'179': 4,
	'180': 4,
	'181': 4,
	'182': 8,
	'183': 7,
	'184': 8,
	'185': 8,
	'186': 8,
	'187': 8,
	'191': 8,
	'192': 8,
	'194': 7,
	'195': 8,
	'197': 4,
	'200': 7,
	'201': 7,
	'202': 7,
	'203': 7,
	'204': 7,
	'205': 7,
	'206': 7,
	'208': 7,
	'217': 4,
	'224': 7,
	'225': 7,
	'229': 7,
	'231': 8,
	'233': 7,
	'234': 7,
	'241': 8,
	'242': 8,
	'243': 8,
	'244': 8,
	'245': 8,
	'247': 8,
	'248': 8,
	'249': 8,
	'251': 8,
	'252': 8,
	'253': 8,
	'254': 8,
	'255': 8,
	'256': 8,
	'257': 8,
	'258': 8,
	'259': 6,
	'260': 8,
	'261': 8,
	'265': 7,
	'266': 7,
	'267': 7,
	'268': 7,
	'269': 7,
	'270': 7,
	'271': 7,
	'272': 7,
	'273': 8,
	'274': 8,
	'277': 7,
	'279': 8,
	'280': 7,
	'281': 7,
	'283': 7,
	'290': 7,
	'291': 7,
	'292': 7,
	'294': 7,
	'295': 7,
	'296': 7,
	'297': 7,
	'298': 7,
	'299': 7,
	'300': 7,
	'301': 7,
	'302': 7,
	'303': 7,
	'304': 7,
	'305': 7,
	'306': 7,
	'307': 7,
	'308': 7,
	'309': 7,
	'310': 7,
	'311': 7,
	'312': 7,
	'313': 7,
	'314': 7,
	'315': 7,
	'316': 7,
	'317': 7,
	'319': 7,
	'320': 7,
	'321': 7,
	'322': 7,
	'323': 7,
	'324': 7,
	'326': 7,
	'327': 7,
	'328': 7,
	'330': 7,
	'331': 7,
	'332': 7,
	'333': 7,
	'334': 7,
	'335': 7,
	'336': 7,
	'337': 7,
	'338': 7,
	'339': 7,
	'341': 8,
	'342': 8,
	'346': 7,
	'347': 7,
	'349': 7,
	'350': 7,
	'351': 7,
	'352': 7,
	'353': 8,
	'354': 8,
	'358': 8,
	'362': 8,
	'363': 8,
	'365': 8,
	'366': 8,
	'368': 8,
	'369': 8,
	'370': 8,
	'374': 7,
	'375': 7,
	'376': 8,
	'377': 8,
	'382': 8,
	'384': 8,
	'386': 8,
	'387': 7,
	'388': 7,
	'390': 7,
	'392': 7,
	'393': 7,
	'394': 7,
	'395': 7,
	'396': 7,
	'397': 7,
	'400': 7,
	'420': 8,
	'427': 8,
	'428': 8,
	'429': 8,
	'430': 8,
	'431': 8,
	'432': 8,
	'433': 8,
	'434': 8,
	'435': 7,
	'436': 7,
	'437': 7,
	'438': 7,
	'439': 7,
	'440': 7,
	'451': 8,
	'454': 7,
	'456': 8,
	'467': 8,
	'470': 8,
	'472': 8,
	'484': 8,
	'486': 8,
	'488': 8,
	'489': 8,
	'490': 8,
	'491': 8,
	'492': 8,
	'493': 8,
	'495': 4,
	'496': 8,
	'497': 8,
	'498': 8,
	'499': 8,
	'500': 2,
	'502': 8,
	'504': 8,
	'506': 8,
	'507': 8,
	'509': 8,
	'511': 8,
	'512': 8,
	'513': 8,
	'515': 8,
	'517': 8,
	'519': 8,
	'522': 8,
	'546': 8,
	'548': 8,
	'549': 8,
	'551': 8,
	'552': 8,
	'554': 8,
	'559': 8,
	'565': 8,
	'566': 8,
	'568': 8,
	'569': 8,
	'570': 8,
	'572': 8,
	'573': 8,
	'577': 8,
	'579': 8,
};
