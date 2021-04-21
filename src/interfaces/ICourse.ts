interface ICourse {
	id?: any;
	courseName: string;
	description: string;
	shortDescription: string;
	link: string;
	previewImageLink: string;
	vendor: string;
	author: object;
	duration: string;
	price: number;
	courseLanguages: string[];
	creationDate: Date;
}

export default ICourse;
