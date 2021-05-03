
//echo header
import { CourseModel } from "../models";

console.log("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
	+ "<sphinx:docset>\n"
	+ "    <sphinx:schema>\n"
	+ "      <sphinx:field name=\"content\"/>\n"
	+ "    </sphinx:schema>\n");

//echo posts
CourseModel.find().limit(2).then((courses) => {
	courses.forEach( function(post) {
		console.log('<sphinx:document id="' + post._id.valueOf() + "\">\n"
			+ '    <content>' + post.toObject().toString().replace(/[><]/g,'') + "</first_name>\n" //обязательно убирайте символы < и >
			+ "</sphinx:document>\n");
	});
});

console.log("</sphinx:docset>");