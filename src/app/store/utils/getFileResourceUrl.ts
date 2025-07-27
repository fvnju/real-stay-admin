
export const getFileResourceUrl = () => {
  if (window.location.hostname === "localhost") {
    return "https://rendamedia.s3.amazonaws.com/";
  }

  return "https://rendamedia.s3.amazonaws.com/";
};
