import Head from "next/head";

const MetaTags = ({ title, keywords, description, image, robots, maxSnippet }) => {
  const robotsContent = [robots, maxSnippet ? `max-snippet:${maxSnippet}` : null]
    .filter(Boolean)
    .join(", ");

  return (
    <Head>
      <meta httpEquiv="content-type" content="text/html; charset=UTF-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      {robotsContent && <meta name="robots" content={robotsContent} />}
      {title && (
        <>
          <meta property="og:site_name" content={title} />
          <title>{title}</title>
          <meta property="og:title" content={title} />
          <meta name="twitter:title" content={title} />
        </>
      )}
      {description && (
        <>
          <meta name="description" content={description} />
          <meta property="og:description" content={description} />
          <meta name="twitter:description" content={description} />
        </>
      )}
      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta name="twitter:image" content={image} />
        </>
      )}
      {keywords && <meta name="keywords" content={keywords} />}
    </Head>
  );
};

export default MetaTags;
