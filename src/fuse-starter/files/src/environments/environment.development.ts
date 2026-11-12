export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  /** Serve sign-in, user and navigation from an in-app mock instead of the backend. */
  devMock: true,
  features: {
    /** 'client' searches the navigation; 'backend' calls POST /search. */
    search: 'client' as 'client' | 'backend',
    /** Online/away/busy status in the user menu (needs backend support). */
    userStatus: false,
    notifications: true,
  },
}
