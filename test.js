import moment from "moment";

// Create a moment object with the current date and time in UTC
const utcDate = moment()

// Format the UTC date as an ISO 8601 string
console.log(utcDate.toISOString());

// Format the UTC date in a more human-readable format
console.log(utcDate.format('YYYY-MM-DDTHH:mm:ss'));
