export class DateUtils {
    static toSql(date: Date): string {
        if (!date) {
            return null;
        }
        return date.toISOString().replace(/T/, ' ').replace(/Z/, '');
    }
}
