from django.db import transaction
from rest_framework import serializers
from .models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer


class SurveyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyQuestion
        fields = ["question_id", "text", "order"]


class SurveyAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAnswer
        fields = ["question", "answer_text"]


class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = SurveyAnswerSerializer(many=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = SurveyResponse
        fields = [
            "response_id", "survey", "student", "student_name",
            "submitted_at", "answers",
        ]
        read_only_fields = ["response_id", "student", "submitted_at"]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def create(self, validated_data):
        answers_data = validated_data.pop("answers")
        response = SurveyResponse.objects.create(**validated_data)
        for answer_data in answers_data:
            SurveyAnswer.objects.create(response=response, **answer_data)
        return response


class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, required=False)
    response_count = serializers.SerializerMethodField()
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            "survey_id", "title", "description", "created_by",
            "created_at", "is_active", "questions", "response_count", "questions_count",
        ]
        read_only_fields = ["survey_id", "created_by", "created_at"]

    def get_response_count(self, obj):
        return obj.responses.count()

    def get_questions_count(self, obj):
        return obj.questions.count()

    @transaction.atomic
    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        survey = Survey.objects.create(**validated_data)
        for q in questions_data:
            SurveyQuestion.objects.create(survey=survey, **q)
        return survey
