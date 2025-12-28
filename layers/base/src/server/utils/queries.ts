import { AdminOTPQueries, AdminQueries } from "@nidoz/database";
import { useDB } from "./database";

export const adminService = new AdminQueries(useDB());
export const adminOTPService = new AdminOTPQueries(useDB());
