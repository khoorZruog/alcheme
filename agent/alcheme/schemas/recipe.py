from pydantic import BaseModel, Field


class RecipeStep(BaseModel):
    step: int
    area: str
    item_id: str
    item_name: str
    technique: str = "standard"  # "standard" | "substitution" | "layering"
    instruction: str
    substitution_note: str | None = None


class RecipeValidation(BaseModel):
    all_items_in_inventory: bool
    missing_items: list[str] = []


class Recipe(BaseModel):
    title: str
    theme: str | None = None
    occasion: str | None = None
    match_score: int = Field(ge=0, le=100)
    thinking_process: list[str]
    steps: list[RecipeStep]
    pro_tips: list[str] = []
    substitution_notes: list[str] = []
    estimated_time_minutes: int | None = None
    difficulty: str | None = None  # "easy" | "medium" | "hard"


class RecipeOutput(BaseModel):
    recipe: Recipe
    used_items: list[str]
    validation: RecipeValidation
