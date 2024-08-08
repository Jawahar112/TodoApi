// customErrors.js
 class CustomError extends Error {
    constructor(message) {
      super(message);
      
      this.statusCode = 500;
      this.status=false 
    }
  }
  
 class BadRequestError extends CustomError {
    constructor(message) {
      super(message);
      this.statusCode=400
    }
  }

  class NotFoundError extends CustomError {
    constructor(message) {
      super(message);
      this.statusCode = 404;
    }
  }
  
  export const customError={
    BadRequestError:BadRequestError,
    NotFoundError:NotFoundError
}
 
  
 
  

