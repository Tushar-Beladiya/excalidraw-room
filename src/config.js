var config = {};

config.endpoint = "https://acvcosmosdb.documents.azure.com:443/";
config.key =
  "jXNi23GxJji8Iyafn06QObdXc8X31KQ2E5AzC0GtrrOzjGVrvi5MUrkZWcbtwwhZuWquZadjOj8g2uDvXflauQ==";

config.database = {
  id: "WhiteboardLB",
};

config.container = {
  id: "Items",
};

config.items = {
  Andersen: {
    id: "Anderson.2",
    Country: "USA",
    partitionKey: "USA",
    lastName: "Andersen",
    parents: [
      {
        firstName: "Thomas",
      },
      {
        firstName: "Mary Kay",
      },
    ],
    children: [
      {
        firstName: "Henriette Thaulow",
        gender: "female",
        grade: 5,
        pets: [
          {
            givenName: "Fluffy",
          },
        ],
      },
    ],
    address: {
      state: "WA",
      county: "King",
      city: "Seattle",
    },
  },
  Wakefield: {
    id: "Wakefield.7",
    partitionKey: "Italy",
    Country: "Italy",
    parents: [
      {
        familyName: "Wakefield",
        firstName: "Robin",
      },
      {
        familyName: "Miller",
        firstName: "Ben",
      },
    ],
    children: [
      {
        familyName: "Merriam",
        firstName: "Jesse",
        gender: "female",
        grade: 8,
        pets: [
          {
            givenName: "Goofy",
          },
          {
            givenName: "Shadow",
          },
        ],
      },
      {
        familyName: "Miller",
        firstName: "Lisa",
        gender: "female",
        grade: 1,
      },
    ],
    address: {
      state: "NY",
      county: "Manhattan",
      city: "NY",
    },
    isRegistered: false,
  },
};

module.exports = config;
