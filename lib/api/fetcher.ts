// SWR fetcher — throws on non-OK responses
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("API request failed");
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};
