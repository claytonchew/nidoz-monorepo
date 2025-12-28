import type {
	EventHandler,
	EventHandlerRequest,
	EventHandlerResponse,
	H3Event,
} from "h3";
import { H3Error } from "h3";
import { fromError, isZodErrorLike } from "zod-validation-error";

export type HandlerContext = {
	t: Awaited<ReturnType<typeof useTranslation>>;
};

type APIEventHandler<
	Request extends EventHandlerRequest = EventHandlerRequest,
	Response extends EventHandlerResponse = EventHandlerResponse,
> = (
	event: H3Event<Request>,
	ctx: HandlerContext,
) => Promise<Response> | Response;

export const defineAPIEventHandler = <T extends EventHandlerRequest, D>(
	handler: APIEventHandler<T, D>,
): EventHandler<T, D> =>
	defineEventHandler<T>(async (event) => {
		const t = await useTranslation(event);

		try {
			return await handler(event, { t });
		} catch (error) {
			if (isZodErrorLike(error)) {
				throw createError({
					statusCode: 400,
					statusMessage: t("ValidationError"),
					message: fromError(error).message,
				});
			}
			if (isZodErrorLike((error as H3Error).data)) {
				throw createError({
					statusCode: 400,
					statusMessage: t("ValidationError"),
					message: fromError((error as H3Error).data).message,
				});
			}
			if (error instanceof H3Error) {
				throw error;
			}
			throw createError({
				statusCode: 500,
				statusMessage: t("InternalServerError"),
				message: (error as Error).message,
			});
		}
	});
