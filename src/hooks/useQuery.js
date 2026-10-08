
import { useEffect, useState } from "react";
import { peekCache, subscribe } from "../api/content";

/*
 * Reads a cached API function (anything made with query() in content.js).
 *
 *   const { data, loading, error } = useQuery(getFaqs);
 *   const { data } = useQuery(getPackageBySlug, slug);
 *
 * - Cached data is there on the FIRST render, so there is no loader flash.
 * - `loading` is true only when there is nothing cached yet.
 * - When a background refresh brings newer data, `data` updates by itself.
 */
export function useQuery(query, ...args) {
  const key = query.key(...args);

  const [data, setData] = useState(() => peekCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    setData(peekCache(key));
    setError(null);

    const unsubscribe = subscribe(key, (fresh) => {
      if (active) setData(fresh);
    });

    query(...args)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
      unsubscribe();
    };
    // `key` already identifies the query and its arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, loading: data === undefined && !error };
}