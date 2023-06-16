/* eslint-disable @typescript-eslint/ban-types */
import { GenericId } from "../values/index.js";
import { describe, expect, test } from "@jest/globals";
import { assert, Equals } from "../test/type_testing.js";
import { SystemIndexes } from "./system_fields.js";
import {
  defineSchema,
  defineTable,
  DataModelFromSchemaDefinition,
} from "./schema.js";
import { v, Infer } from "../values/validator.js";

describe("DataModelFromSchemaDefinition", () => {
  test("defineSchema produces the correct data model for basic types", () => {
    const schema = defineSchema({
      table: defineTable({
        ref: v.id("reference"),
        null: v.null(),
        number: v.number(),
        bigint: v.bigint(),
        boolean: v.boolean(),
        string: v.string(),
        bytes: v.bytes(),
        array: v.array(v.boolean()),
        set: v.set(v.number()),
        map: v.map(v.string(), v.number()),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      ref: GenericId<"reference">;
      null: null;
      number: number;
      bigint: bigint;
      boolean: boolean;
      string: string;
      array: boolean[];
      bytes: ArrayBuffer;
      set: Set<number>;
      map: Map<string, number>;
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "ref"
      | "null"
      | "number"
      | "bigint"
      | "boolean"
      | "string"
      | "bytes"
      | "array"
      | "set"
      | "map";

    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };

    assert<Equals<DataModel, ExpectedDataModel>>();
  });
  test("defineSchema produces the correct data model any", () => {
    const schema = defineSchema({
      table: defineTable({
        any: v.any(),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      any: any;
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "any"
      // You can index anything into an `any`
      | `any.${string}`;

    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };

    assert<Equals<DataModel, ExpectedDataModel>>();
  });
  test("defineSchema handles all the literal types", () => {
    const schema = defineSchema({
      table: defineTable({
        string: v.literal("string"),
        number: v.literal(1),
        bigint: v.literal(1n),
        boolean: v.literal(true),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      string: "string";
      number: 1;
      bigint: 1n;
      boolean: true;
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "string"
      | "number"
      | "bigint"
      | "boolean";

    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema handles nested objects", () => {
    const schema = defineSchema({
      table: defineTable({
        prop1: v.string(),
        nested: v.object({
          prop2: v.string(),
          doublyNested: v.object({
            prop3: v.string(),
          }),
        }),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      prop1: string;
      nested: {
        prop2: string;
        doublyNested: {
          prop3: string;
        };
      };
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "prop1"
      | "nested"
      | "nested.prop2"
      | "nested.doublyNested"
      | "nested.doublyNested.prop3";

    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema handles object unions", () => {
    const schema = defineSchema({
      table: defineTable(
        v.union(
          v.object({
            string: v.string(),
          }),
          v.object({
            number: v.number(),
          })
        )
      ),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument =
      | {
          _id: GenericId<"table">;
          _creationTime: number;
          string: string;
        }
      | {
          _id: GenericId<"table">;
          _creationTime: number;
          number: number;
        };
    type ExpectedFieldPaths = "_id" | "_creationTime" | "string" | "number";
    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema handles mixed unions", () => {
    // Testing that we can mix objects and other things in unions and still
    // generate the right index field paths.
    const schema = defineSchema({
      table: defineTable({
        property: v.union(v.object({ string: v.string() }), v.number()),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      property: { string: string } | number;
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "property"
      | "property.string";
    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema handles array of unions", () => {
    const schema = defineSchema({
      table: defineTable({
        property: v.array(v.union(v.number(), v.string())),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      property: (number | string)[];
    };
    type ExpectedFieldPaths = "_id" | "_creationTime" | "property";
    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema handles optional keys", () => {
    const schema = defineSchema({
      table: defineTable({
        required: v.string(),
        optional: v.optional(v.boolean()),
        nested: v.object({
          required: v.bigint(),
          optional: v.optional(v.number()),
        }),
      }),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      required: string;
      optional?: boolean;
      nested: {
        required: bigint;
        optional?: number;
      };
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "required"
      | "optional"
      | "nested"
      | "nested.required"
      | "nested.optional";

    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: SystemIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema supports loose schemas", () => {
    const schema = defineSchema(
      {
        table: defineTable({
          property: v.string(),
        }),
      },
      { strictTableNameTypes: false }
    );

    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      property: string;
    };

    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: "_id" | "_creationTime" | "property";
        indexes: SystemIndexes;
        searchIndexes: {};
      };
      [tableName: string]: {
        document: any;
        fieldPaths: string;
        indexes: {};
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });

  test("defineSchema generates index types", () => {
    const schema = defineSchema({
      table: defineTable({
        property1: v.string(),
        property2: v.string(),
      })
        .index("by_property1", ["property1"])
        .index("by_property1_property2", ["property1", "property2"]),
    });
    type DataModel = DataModelFromSchemaDefinition<typeof schema>;
    type ExpectedDocument = {
      _id: GenericId<"table">;
      _creationTime: number;
      property1: string;
      property2: string;
    };
    type ExpectedFieldPaths =
      | "_id"
      | "_creationTime"
      | "property1"
      | "property2";
    type ExpectedIndexes = {
      by_property1: ["property1", "_creationTime"];
      by_property1_property2: ["property1", "property2", "_creationTime"];

      // System index
      by_creation_time: ["_creationTime"];
    };
    type ExpectedDataModel = {
      table: {
        document: ExpectedDocument;
        fieldPaths: ExpectedFieldPaths;
        indexes: ExpectedIndexes;
        searchIndexes: {};
      };
    };
    assert<Equals<DataModel, ExpectedDataModel>>();
  });
});

test("defineSchema generates search index types", () => {
  const schema = defineSchema({
    table: defineTable({
      property1: v.string(),
      property2: v.string(),
    })
      .searchIndex("no_filter_fields", {
        searchField: "property1",
      })
      .searchIndex("one_filter_field", {
        searchField: "property1",
        filterFields: ["property1"],
      })
      .searchIndex("two_filter_fields", {
        searchField: "property1",
        filterFields: ["property1", "property2"],
      }),
  });
  type DataModel = DataModelFromSchemaDefinition<typeof schema>;
  type ExpectedDocument = {
    _id: GenericId<"table">;
    _creationTime: number;
    property1: string;
    property2: string;
  };
  type ExpectedFieldPaths = "_id" | "_creationTime" | "property1" | "property2";
  type ExpectedSearchIndexes = {
    no_filter_fields: {
      searchField: "property1";
      filterFields: never;
    };
    one_filter_field: {
      searchField: "property1";
      filterFields: "property1";
    };
    two_filter_fields: {
      searchField: "property1";
      filterFields: "property1" | "property2";
    };
  };
  type ExpectedDataModel = {
    table: {
      document: ExpectedDocument;
      fieldPaths: ExpectedFieldPaths;
      indexes: SystemIndexes;
      searchIndexes: ExpectedSearchIndexes;
    };
  };
  assert<Equals<DataModel, ExpectedDataModel>>();
});

test("defineTable collects indexes", () => {
  const table = defineTable({
    a: v.string(),
    b: v.string(),
  })
    .index("by_a", ["a"])
    .index("by_a_b", ["a", "b"]);

  expect(table.export().indexes).toEqual([
    { indexDescriptor: "by_a", fields: ["a"] },
    { indexDescriptor: "by_a_b", fields: ["a", "b"] },
  ]);
});

describe("JsonTypesFromSchema", () => {
  test("TableDefinition includes field types", () => {
    const table = defineTable({
      ref: v.id("reference"),
      nullField: v.null(),
      numberField: v.number(),
      bigintField: v.bigint(),
      booleanField: v.boolean(),
      stringField: v.string(),
      bytesField: v.bytes(),
      arrayField: v.array(v.boolean()),
      setField: v.set(v.number()),
      mapField: v.map(v.string(), v.number()),
      anyField: v.any(),
      literalBigint: v.literal(1n),
      literalNumber: v.literal(0.0),
      literalString: v.literal("hello world"),
      literalBoolean: v.literal(true),
      union: v.union(v.string(), v.number()),
      object: v.object({ a: v.optional(v.any()) }),
    }).export();
    expect(table.documentType).toEqual({
      type: "object",
      value: {
        ref: {
          fieldType: { type: "id", tableName: "reference" },
          optional: false,
        },
        nullField: { fieldType: { type: "null" }, optional: false },
        numberField: { fieldType: { type: "number" }, optional: false },
        bigintField: { fieldType: { type: "bigint" }, optional: false },
        booleanField: { fieldType: { type: "boolean" }, optional: false },
        stringField: { fieldType: { type: "string" }, optional: false },
        bytesField: { fieldType: { type: "bytes" }, optional: false },
        arrayField: {
          fieldType: { type: "array", value: { type: "boolean" } },
          optional: false,
        },
        setField: {
          fieldType: { type: "set", value: { type: "number" } },
          optional: false,
        },
        mapField: {
          fieldType: {
            type: "map",
            keys: { type: "string" },
            values: { type: "number" },
          },
          optional: false,
        },
        anyField: { fieldType: { type: "any" }, optional: false },
        literalBigint: {
          fieldType: {
            type: "literal",
            value: {
              $integer: "AQAAAAAAAAA=",
            },
          },
          optional: false,
        },
        literalNumber: {
          fieldType: {
            type: "literal",
            value: 0.0,
          },
          optional: false,
        },
        literalString: {
          fieldType: {
            type: "literal",
            value: "hello world",
          },
          optional: false,
        },
        literalBoolean: {
          fieldType: {
            type: "literal",
            value: true,
          },
          optional: false,
        },
        union: {
          fieldType: {
            type: "union",
            value: [{ type: "string" }, { type: "number" }],
          },
          optional: false,
        },
        object: {
          fieldType: {
            type: "object",
            value: {
              a: { fieldType: { type: "any" }, optional: true },
            },
          },
          optional: false,
        },
      },
    });
  });
  test("TableDefinition includes union and object types", () => {
    const table = defineTable(
      v.union(
        v.object({ a: v.array(v.number()), b: v.optional(v.string()) }),
        v.object({ c: v.any(), d: v.bytes() })
      )
    ).export();
    expect(table.documentType).toEqual({
      type: "union",
      value: [
        {
          type: "object",
          value: {
            a: {
              fieldType: { type: "array", value: { type: "number" } },
              optional: false,
            },
            b: { fieldType: { type: "string" }, optional: true },
          },
        },
        {
          type: "object",
          value: {
            c: { fieldType: { type: "any" }, optional: false },
            d: { fieldType: { type: "bytes" }, optional: false },
          },
        },
      ],
    });
  });
});

test("Infer", () => {
  const documentSchema = v.object({
    property: v.string(),
  });

  type Actual = Infer<typeof documentSchema>;
  type Expected = {
    property: string;
  };

  assert<Equals<Actual, Expected>>();
});
