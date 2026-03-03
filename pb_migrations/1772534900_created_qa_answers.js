/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const qaAnswers = new Collection({
    id: "qa_answers_collection",
    name: "qa_answers",
    schema: [
      {
        id: "qa_answers_lead_id",
        name: "lead_id",
        type: "relation",
        required: true,
        options: {
          collectionId: "leads_collection",
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        id: "qa_answers_question_id",
        name: "question_id",
        type: "relation",
        required: true,
        options: {
          collectionId: "qa_questions_collection",
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        id: "qa_answers_selected_answer",
        name: "selected_answer",
        type: "select",
        required: true,
        options: {
          values: ["a", "b", "c"],
          maxSelect: 1
        }
      },
      {
        id: "qa_answers_points_earned",
        name: "points_earned",
        type: "number",
        required: true,
        options: {
          min: 0,
          max: 1000
        }
      },
      {
        id: "qa_answers_answered_at",
        name: "answered_at",
        type: "date",
        required: false
      }
    ]
  });

  const qaAnswersIndex = new Index({
    collectionId: "qa_answers_collection",
    fields: [
      {
        id: "qa_answers_lead_id_idx",
        name: "lead_id",
        type: "index"
      },
      {
        id: "qa_answers_question_id_idx",
        name: "question_id",
        type: "index"
      }
    ]
  });

  app.save(qaAnswers);
  app.save(qaAnswersIndex);
}, (app) => {
  // Rollback
  app.findCollectionByNameOrId("qa_answers_collection")?.delete();
});
