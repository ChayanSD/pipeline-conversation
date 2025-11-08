import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
    service : "gmail",
    auth : {
        user : "chayansd5656@gmail.com",
        pass : process.env.APP_PASSWORD,
    }
});

export default transport;