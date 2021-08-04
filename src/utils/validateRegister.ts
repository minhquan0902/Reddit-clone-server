import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  // email validation
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invalid Email address!",
      },
    ];
  }

  if (options.email.length <= 2) {
    return [
      {
        field: "email",
        message: "email must have more than 2 characters",
      },
    ];
  }

  // username validation
  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "username must have more than 2 characters",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "cannot include an @",
      },
    ];
  }

  // password validation
  if (options.password.length <= 3) {
    return [
      {
        field: "password",
        message: "password must have more than 3  characters",
      },
    ];
  }
  return null;
};
