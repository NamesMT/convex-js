import { test } from "@jest/globals";
import { assert, Equals } from "../test/type_testing.js";
import { v } from "../values/validator.js";
import { ApiFromModules, DefaultFunctionArgs } from "./index.js";
import { EmptyObject, MutationBuilder } from "./registration.js";

describe("argument inference", () => {
  // Test with mutation, but all the wrappers work the same way.
  const mutation: MutationBuilder<any, "public"> = (() => {
    // Intentional noop. We're only testing the type
  }) as any;

  const module = {
    inlineNoArg: mutation(() => "result"),
    inlineUntypedArg: mutation((_ctx, { _arg }) => "result"),
    inlineTypedArg: mutation((_ctx, { _arg }: { _arg: string }) => "result"),

    // There are unusual syntaxes.
    inlineUntypedDefaultArg: mutation(
      (_ctx, { _arg } = { _arg: 1 }) => "result",
    ),
    inlineTypedDefaultArg: mutation(
      // @ts-expect-error This syntax has never been allowed.
      (_ctx, { _arg }: { _arg: string } = { _arg: "default" }) => "result",
    ),
    inlineTypedOptionalDefaultArg: mutation(
      (_ctx, { _arg }: { _arg?: string } = { _arg: "default" }) => "result",
    ),

    configNoArg: mutation({
      handler: () => "result",
    }),
    configValidatorNoArg: mutation({
      args: {},
      handler: () => "result",
    }),
    configUntypedArg: mutation({
      handler: (_, { arg }) => {
        assert<Equals<typeof arg, unknown>>;
        return "result";
      },
    }),
    configTypedArg: mutation({
      handler: (_, { arg }: { arg: string }) => {
        assert<Equals<typeof arg, string>>;
        return "result";
      },
    }),
    configOptionalValidatorUntypedArg: mutation({
      args: {
        arg: v.optional(v.string()),
      },
      handler: (_, { arg }) => {
        assert<Equals<typeof arg, string | undefined>>;
        return "result";
      },
    }),
    configValidatorUntypedArg: mutation({
      args: {
        arg: v.string(),
      },
      handler: (_, { arg }: { arg: string }) => {
        assert<Equals<typeof arg, string>>;
        return "result";
      },
    }),
    configValidatorTypedArg: mutation({
      args: {
        arg: v.string(),
      },
      handler: (_, { arg }: { arg: string }) => {
        assert<Equals<typeof arg, string>>;
        return "result";
      },
    }),
    // This error could be prettier if we stop overloading the builders.
    // @ts-expect-error  The arg type mismatches
    configValidatorMismatchedTypedArg: mutation({
      args: {
        _arg: v.number(),
      },
      handler: (_, { _arg }: { _arg: string }) => {
        return "result";
      },
    }),

    // These are unusual syntaxes. We'd like to break some of them.
    // Let's document them here so it's clear when we do that.
    configUntypedDefaultArg: mutation({
      handler: (_, { arg } = { arg: "default" }) => {
        assert<Equals<typeof arg, unknown>>;
        return "result";
      },
    }),
    configTypedDefaultArg: mutation({
      // @ts-expect-error This syntax has never been allowed.
      handler: (_, { arg }: { arg: string } = { arg: "default" }) => {
        assert<Equals<typeof arg, string>>;
        return "result";
      },
    }),
    configTypedOptionalDefaultArg: mutation({
      handler: (_, { arg }: { arg?: string } = { arg: "default" }) => {
        assert<Equals<typeof arg, string | undefined>>;
        return "result";
      },
    }),
    configValidatorUntypedDefaultArg: mutation({
      args: {
        arg: v.string(),
      },
      // @ts-expect-error This syntax has never been allowed.
      handler: (_, { arg } = { arg: "default" }) => {
        assert<Equals<typeof arg, string>>;
        return "result";
      },
    }),
    configValidatorTypedDefaultArg: mutation({
      args: {
        arg: v.string(),
      },
      handler: (_, { arg }: { arg: string } = { arg: "default" }) => {
        assert<Equals<typeof arg, string>>;
        return "result";
      },
    }),
    configValidatorTypedOptionalDefaultArg: mutation({
      args: {
        arg: v.string(),
      },
      handler: (_, { arg }: { arg?: string } = { arg: "default" }) => {
        assert<Equals<typeof arg, string | undefined>>;
        return "result";
      },
    }),
  };
  type API = ApiFromModules<{ module: typeof module }>;

  test("inline with no arg", () => {
    type Args = API["module"]["inlineNoArg"]["_args"];
    assert<Equals<Args, EmptyObject>>();
  });

  test("inline with untyped arg", () => {
    type Args = API["module"]["inlineUntypedArg"]["_args"];
    type ExpectedArgs = DefaultFunctionArgs;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("inline with typed arg", () => {
    type Args = API["module"]["inlineTypedArg"]["_args"];
    type ExpectedArgs = { _arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  // This is not a very useful type (allows any key) but let's
  // test it so we know if it's changing.
  test("inline with untyped arg with default value", () => {
    type Args = API["module"]["inlineUntypedDefaultArg"]["_args"];
    type ExpectedArgs = DefaultFunctionArgs | EmptyObject;
    assert<Equals<Args, ExpectedArgs>>;
  });

  // This syntax is a type error where it is defined so it falls back.
  test("inline with typed arg with default value", () => {
    type Args = API["module"]["inlineTypedDefaultArg"]["_args"];
    type ExpectedArgs = Record<string, any>;
    assert<Equals<Args, ExpectedArgs>>;
  });

  // This is not a very useful type (allows any key) but add let's
  // test it so we know if it's changing.
  test("inline with typed arg with optional default value", () => {
    type Args = API["module"]["inlineTypedOptionalDefaultArg"]["_args"];
    type ExpectedArgs = DefaultFunctionArgs | EmptyObject;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with no arg", () => {
    type Args = API["module"]["configNoArg"]["_args"];
    type ExpectedArgs = EmptyObject;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with no arg and validator", () => {
    type Args = API["module"]["configValidatorNoArg"]["_args"];
    // eslint-disable-next-line @typescript-eslint/ban-types
    type ExpectedArgs = {};
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with untyped arg", () => {
    type Args = API["module"]["configUntypedArg"]["_args"];
    type ExpectedArgs = DefaultFunctionArgs;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with typed arg", () => {
    type Args = API["module"]["configTypedArg"]["_args"];
    type ExpectedArgs = { arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with untyped arg and validator", () => {
    type Args = API["module"]["configValidatorUntypedArg"]["_args"];
    type ExpectedArgs = { arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with untyped arg and optional validator", () => {
    type Args = API["module"]["configOptionalValidatorUntypedArg"]["_args"];
    type ExpectedArgs = { arg?: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with typed arg and validator", () => {
    type Args = API["module"]["configValidatorTypedArg"]["_args"];
    type ExpectedArgs = { arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with untyped arg and a default", () => {
    type Args = API["module"]["configUntypedDefaultArg"]["_args"];
    // This is not a very useful type
    type ExpectedArgs = DefaultFunctionArgs | EmptyObject;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with typed arg and a default", () => {
    type Args = API["module"]["configTypedDefaultArg"]["_args"];
    // This is a type error at the definition site so this is the fallback.
    type ExpectedArgs = Record<string, any>;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with typed optional arg and a default", () => {
    type Args = API["module"]["configTypedOptionalDefaultArg"]["_args"];
    // This is not a very useful type
    type ExpectedArgs = DefaultFunctionArgs | EmptyObject;
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with untyped arg and a validator and a default", () => {
    type Args = API["module"]["configValidatorUntypedDefaultArg"]["_args"];
    type ExpectedArgs = { arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with typed arg and a validator and a default", () => {
    type Args = API["module"]["configValidatorTypedDefaultArg"]["_args"];
    type ExpectedArgs = { arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });

  test("config with typed optional arg and a validator and a default", () => {
    type Args =
      API["module"]["configValidatorTypedOptionalDefaultArg"]["_args"];
    type ExpectedArgs = { arg: string };
    assert<Equals<Args, ExpectedArgs>>;
  });
});
