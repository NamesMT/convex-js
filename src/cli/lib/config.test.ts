import { vi, test, expect } from "vitest";
import { parseProjectConfig } from "./config.js";
import { logFailure, oneoffContext } from "../../bundler/context.js";
import stripAnsi from "strip-ansi";

test("parseProjectConfig", async () => {
  // Make a context that throws on crashes so we can detect them.
  const ctx = {
    ...oneoffContext,
    crash: (args: { printedMessage: string | null }) => {
      if (args.printedMessage !== null) {
        logFailure(oneoffContext, args.printedMessage);
      }
      // eslint-disable-next-line no-restricted-syntax
      throw new Error();
    },
  };
  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => {
    // Do nothing
    return true;
  });
  const assertParses = async (inp: any) => {
    expect(await parseProjectConfig(ctx, inp)).toEqual(inp);
  };
  const assertParseError = async (inp: any, err: string) => {
    await expect(parseProjectConfig(ctx, inp)).rejects.toThrow();
    const calledWith = stderrSpy.mock.calls as string[][];
    expect(stripAnsi(calledWith[0][0])).toEqual(err);
  };

  await assertParses({
    team: "team",
    project: "proj",
    prodUrl: "prodUrl",
    functions: "functions/",
  });

  await assertParses({
    team: "team",
    project: "proj",
    prodUrl: "prodUrl",
    functions: "functions/",
    authInfos: [],
  });

  await assertParses({
    team: "team",
    project: "proj",
    prodUrl: "prodUrl",
    functions: "functions/",
    authInfos: [
      {
        applicationID: "hello",
        domain: "world",
      },
    ],
  });

  await assertParseError(
    {
      team: "team",
      project: "proj",
      prodUrl: "prodUrl",
      functions: "functions/",
      authInfo: [{}],
    },
    "✖ Expected `authInfo` in `convex.json` to be type AuthInfo[]\n",
  );
});
