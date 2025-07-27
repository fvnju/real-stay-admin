export const getBaseURL = () => {

  if (window.location.hostname !== "localhost") {
    return "api.renda.co/";
  }

  return "http://rendatestapiserver.us-east-1.elasticbeanstalk.com/";
};
