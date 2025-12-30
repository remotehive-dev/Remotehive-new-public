import { useEffect } from 'react';

export function GoogleCustomSearch() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cse.google.com/cse.js?cx=9719bae582bf849d7";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="gcse-search"></div>
  );
}
