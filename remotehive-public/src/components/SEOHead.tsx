import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { fetchSEOConfig, SEOConfig } from '../lib/api';

export function SEOHead() {
  const location = useLocation();
  const [config, setConfig] = useState<SEOConfig | null>(null);

  useEffect(() => {
    fetchSEOConfig().then(data => {
      if (data) setConfig(data);
    });
  }, []);

  if (!config) return null;

  // Match current page
  const currentPath = location.pathname;
  const pageSEO = config.pages[currentPath] || config.pages['/'];

  return (
    <Helmet>
      {/* Page Specific Metadata */}
      {pageSEO?.title && <title>{pageSEO.title}</title>}
      {pageSEO?.description && <meta name="description" content={pageSEO.description} />}
      {pageSEO?.keywords && <meta name="keywords" content={pageSEO.keywords} />}
      {pageSEO?.canonical_url && <link rel="canonical" href={pageSEO.canonical_url} />}
      {pageSEO?.no_index && <meta name="robots" content="noindex, nofollow" />}
      
      {/* OpenGraph */}
      {pageSEO?.title && <meta property="og:title" content={pageSEO.title} />}
      {pageSEO?.description && <meta property="og:description" content={pageSEO.description} />}
      {pageSEO?.og_image && <meta property="og:image" content={pageSEO.og_image} />}
      <meta property="og:url" content={window.location.href} />

      {/* Global Tags */}
      {config.global_tags?.map((tag, index) => {
          if (tag.location === 'head') {
              // Basic support for meta tags defined as global
              if (tag.name && tag.content) {
                  return <meta key={`global-${index}`} name={tag.name} content={tag.content} />;
              }
          }
          return null;
      })}

      {/* Marketing / Ads Scripts (Production Only) */}
      {import.meta.env.PROD && config.marketing?.map((item, index) => {
        // Meta Pixel (Facebook/Instagram)
        if (item.provider === 'meta' && item.pixel_id) {
          return (
            <script key={`meta-${index}`} type="text/javascript">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${item.pixel_id}');
                fbq('track', 'PageView');
              `}
            </script>
          );
        }
        
        // Google Ads / Analytics (Gtag)
        if ((item.provider === 'google_ads' || item.provider === 'google_analytics') && item.pixel_id) {
             return (
                <React.Fragment key={`google-${index}`}>
                    <script async src={`https://www.googletagmanager.com/gtag/js?id=${item.pixel_id}`} />
                    <script type="text/javascript">
                        {`
                          window.dataLayer = window.dataLayer || [];
                          function gtag(){dataLayer.push(arguments);}
                          gtag('js', new Date());
                          gtag('config', '${item.pixel_id}');
                        `}
                    </script>
                </React.Fragment>
             );
        }

        // Custom Scripts or Fallback
        if (item.script_content) {
             // Heuristic to detect if the user pasted a full <script> tag
             if (item.script_content.trim().startsWith('<script')) {
                // If it's a full script tag, we can't easily inject it inside another script tag via Helmet.
                // We'll parse it to extract src or content, or warn.
                // For now, let's assume it's JS code if it doesn't start with <script
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(item.script_content, 'text/html');
                    const script = doc.querySelector('script');
                    if (script) {
                        if (script.src) {
                             return <script key={`custom-${index}`} async={script.async} defer={script.defer} src={script.src} type={script.type || "text/javascript"} />;
                        } else {
                             return (
                                <script key={`custom-${index}`} type={script.type || "text/javascript"}>
                                    {script.innerHTML}
                                </script>
                             );
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse custom script content", e);
                }
                return null;
             }

             return (
                 <script key={`custom-${index}`} type="text/javascript">
                     {item.script_content}
                 </script>
             );
        }
        return null;
      })}
    </Helmet>
  );
}
