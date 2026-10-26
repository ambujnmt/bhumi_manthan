import Script from "next/script";

export default function ScriptTag({ scripts }) {
  return (
    <>
      {scripts?.length && (
        <div>
          {scripts.map((scriptItem, index) =>
            scriptItem?.scrc ? (
              <Script
                key={index}
                src={scriptItem.src}
                async={scriptItem?.async || false}
              />
            ) : (
              <Script
                key={index}
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{ __html: scriptItem?.innerHTML }}
              />
            )
          )}
        </div>
      )}
    </>
  );
}
