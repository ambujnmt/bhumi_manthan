import Head from 'next/head';

export default function Favicon({favicon }) {
  return (
    <div>
      {favicon && (
        <Head>
          <meta name="msapplication-square" content={favicon} />
          <link rel="icon" type="image/x-icon" href={favicon} />
          <link rel="apple-touch-icon" href={favicon} />
        </Head>
      )}
    </div>
  );
}