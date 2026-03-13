ALLOWED_TEMPLATE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}
ALLOWED_CSV_EXTENSIONS = {".csv"}


def validate_template_file(filename: str):
    if not filename:
        return "No filename provided."
    ext = ("." + filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""
    if ext not in ALLOWED_TEMPLATE_EXTENSIONS:
        return f"Invalid file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_TEMPLATE_EXTENSIONS))}"
    return None


def validate_csv_file(filename: str):
    if not filename:
        return "No filename provided."
    ext = ("." + filename.rsplit(".", 1)[-1]).lower() if "." in filename else ""
    if ext not in ALLOWED_CSV_EXTENSIONS:
        return f"Invalid file type '{ext}'. Only .csv files are allowed."
    return None