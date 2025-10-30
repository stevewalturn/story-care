import { Sponsors } from './Sponsors';

export const Hello = async () => {
  // TODO: Get user from Firebase Auth
  const userEmail = 'user@example.com';

  return (
    <>
      <p>
        {`👋 Hello ${userEmail}!`}
      </p>
      <p>
        Looking for a more advanced solution?
        {' '}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://nextjs-boilerplate.com/pro-saas-starter-kit"
        >
          Next.js Boilerplate SaaS
        </a>
      </p>
      <Sponsors />
    </>
  );
};
