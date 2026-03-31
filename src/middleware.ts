import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  // Apply middleware to all routes except api, _next, favicon.ico, login page, and images
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|images).*)"],
};
