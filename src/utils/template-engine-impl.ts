import * as fs from "fs";
import * as handlebars from "handlebars";
import * as path from "path";
import { TemplateEngine } from "./template-engine";

export class HbsTemplateEngine extends TemplateEngine {
    async compile(templatePath: string, data: object): Promise<string> {
        if (!path.isAbsolute(templatePath)) {
            templatePath = path.resolve(
                process.env.EMAIL_TEMPLATES_PATH || "static/email-templates",
                templatePath,
            );
        }
        const template = handlebars.compile(
            fs.readFileSync(templatePath).toString(),
        );
        return template({
            BASE_URL: process.env.BASE_URL || "https://api.telah.app",
            LOGIN_URL: process.env.LOGIN_URL || "https://telah.ng/auth/signin",
            TERMS_AND_CONDITION_URL:
                process.env.TERMS_AND_CONDITION_URL ||
                "https://telah.ng/terms-and-conditions",
            PRIVACY_POLICY_URL:
                process.env.PRIVACY_POLICY_URL ||
                "https://telah.ng/privacy-policies",
            ...data,
        });
    }
}
