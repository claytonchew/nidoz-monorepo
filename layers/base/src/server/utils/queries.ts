import {
	AdminOTPQueries,
	AdminQueries,
	UnitQueries,
	UnitOTPQueries,
	VehicleQueries,
} from "@nidoz/database";
import { useDB } from "./database";

export const adminQueries = new AdminQueries(useDB());
export const adminOTPQueries = new AdminOTPQueries(useDB());
export const unitQueries = new UnitQueries(useDB());
export const unitOTPQueries = new UnitOTPQueries(useDB());
export const vehicleQueries = new VehicleQueries(useDB());
