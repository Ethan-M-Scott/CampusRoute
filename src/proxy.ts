// Middleware-style auth proxy for guarding route pages during navigation.
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session) {
        return NextResponse.redirect(new URL("/#register", request.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: ["/routes"], // Apply middleware to specific routes
};