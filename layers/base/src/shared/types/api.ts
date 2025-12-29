import type { FetchResult } from "#app";
import type { AvailableRouterMethod } from "nitropack/types";
import type { Simplify } from "@nidoz/utils";

/**
 * A utility type that infers the response type from an API request.
 *
 * @example
 * // Get the response type for a GET request
 * type GetUsersResponse = APIResponse<'/api/users', 'get'>;
 * // Result: {
 * //   records: { id: string; name: string; createdAt: string }[];
 * //   totalCount: number;
 * //   page: number;
 * //   pageSize: number;
 * // }
 *
 * // Get the response type for a POST request
 * type CreateUserResponse = APIResponse<'/api/user', 'post'>;
 * // Result: { id: string; name: string; createdAt: string };
 */
export type APIResponse<
	ReqT extends string,
	ReqMethod extends AvailableRouterMethod<ReqT>,
> = Simplify<FetchResult<ReqT, ReqMethod>>;
