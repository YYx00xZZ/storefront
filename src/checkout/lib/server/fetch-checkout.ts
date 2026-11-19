import "server-only";

import {
	CheckoutDocument,
	type CheckoutQuery,
	type CheckoutQueryVariables,
} from "@/checkout/graphql/generated/operations";
import type { CheckoutFetchResult } from "@/checkout/lib/checkout-types";
import { toTypedDocument } from "@/checkout/lib/server/to-typed-document";
import { sessionQuery } from "@/lib/saleor";
import { checkoutGraphqlLocaleVariables } from "@/lib/checkout-locale";
import type { LocaleSlug } from "@/config/locale";

const checkoutQueryDocument = toTypedDocument<CheckoutQuery, CheckoutQueryVariables>(CheckoutDocument);

/**
 * Fetch checkout for the checkout RSC page (the checkout ID is the credential).
 *
 * Sent with the customer's token when signed in (anonymous otherwise), so Saleor returns
 * `checkout.user` to its owner instead of a permission error.
 */
export async function fetchCheckoutOnServer(
	checkoutId: string,
	localeSlug?: LocaleSlug,
): Promise<CheckoutFetchResult> {
	const result = await sessionQuery(checkoutQueryDocument, {
		variables: { id: checkoutId, ...(await checkoutGraphqlLocaleVariables(localeSlug)) },
	});

	if (!result.ok) {
		if (process.env.NODE_ENV === "development") {
			console.error(
				"[fetchCheckoutOnServer] failed:",
				result.error.type,
				result.error.message || "(no message)",
				{ checkoutId },
			);
		}
		return { ok: false };
	}

	return { ok: true, checkout: result.data.checkout ?? null };
}
