import { Button } from "../shared/Button";

export function Login() {
  return (
    <>
      <label htmlFor="password">Enter your password to log in.</label>
      <input
        type="password"
        name="password"
        className="border-1 mb-4 border-gray-400"
      ></input>
      <Button type="submit" onClick={() => {}}>
        Log In
      </Button>
    </>
  );
}
