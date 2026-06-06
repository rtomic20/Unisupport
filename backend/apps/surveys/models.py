from django.db import models


class Survey(models.Model):
    survey_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_surveys",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "surveys"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class SurveyQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "survey_questions"
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class SurveyResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="responses")
    student = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="survey_responses",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "survey_responses"
        unique_together = [("survey", "student")]

    def __str__(self):
        return f"Odgovor: {self.student} na '{self.survey}'"


class SurveyAnswer(models.Model):
    answer_id = models.AutoField(primary_key=True)
    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField()

    class Meta:
        db_table = "survey_answers"
