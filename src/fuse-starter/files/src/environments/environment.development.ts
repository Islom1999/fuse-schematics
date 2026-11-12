export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  /** Serve sign-in, user and navigation from an in-app mock instead of the backend. */
  devMock: true,
  /** File uploads: 'multipart' (one POST) or 'tus' (resumable, needs the upload-tus add-on). */
  upload: 'multipart' as 'multipart' | 'tus',
  /** tus endpoint; empty means `<apiUrl>/files/tus`. For the tusd engine use its URL, e.g. http://localhost:8080/files/. */
  tusEndpoint: '',
  features: {
    /** 'client' searches the navigation; 'backend' calls POST /search. */
    search: 'client' as 'client' | 'backend',
    /** Online/away/busy status in the user menu (needs backend support). */
    userStatus: false,
    notifications: true,
  },
}
