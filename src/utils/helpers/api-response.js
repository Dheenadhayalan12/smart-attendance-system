const apiResponse = (
  statusCode,
  success,
  message,
  data = null,
  error = null
) => {
  const responseBody = {
    success,
    message,
  };

  if (data !== null) {
    responseBody.data = data;
  }

  if (error !== null) {
    responseBody.error = error;
  }

  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(responseBody),
  };
};

module.exports = {
  apiResponse,
};
