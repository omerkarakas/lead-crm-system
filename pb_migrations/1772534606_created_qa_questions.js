/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "question_text",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json1874629670",
        "maxSize": 0,
        "name": "options",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json2874629671",
        "maxSize": 0,
        "name": "points",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number848901969",
        "max": 1000,
        "min": 0,
        "name": "order",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bool1234567890",
        "name": "is_active",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_3705076666",
    "indexes": [],
    "listRule": null,
    "name": "qa_questions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  const savedCollection = app.save(collection);

  // Seed default questions
  const dao = new Dao();

  // Question 1: Şirket büyüklüğü
  const q1 = new Record(savedCollection);
  q1.set("question_text", "Şirketinizde kaç kişi çalışıyor?");
  q1.set("options", ["a) 1-10 kişi", "b) 11-50 kişi", "c) 51+ kişi"]);
  q1.set("points", { "a": 30, "b": 60, "c": 100 });
  q1.set("order", 1);
  q1.set("is_active", true);
  dao.saveRecord(q1);

  // Question 2: Hizmet türü
  const q2 = new Record(savedCollection);
  q2.set("question_text", "Hangi hizmeti arıyorsunuz?");
  q2.set("options", ["a) Danışmanlık", "b) Yazılım Geliştirme", "c) Dijital Pazarlama"]);
  q2.set("points", { "a": 30, "b": 60, "c": 100 });
  q2.set("order", 2);
  q2.set("is_active", true);
  dao.saveRecord(q2);

  return savedCollection;
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3705076666");

  return app.delete(collection);
})
