# Firebase to CSV Converter for Social Exposure Theory Experiment
#
# This script downloads data from Firebase Realtime Database and converts it to CSV files
# for analysis in R.
#
# Usage:
#   source("firebase_to_csv.R")
#   export_all()
#
# Output:
#   - participants.csv: One row per participant with metadata and summary scores
#   - phase1_trials.csv: All Phase 1 trials (long format)
#   - phase2_trials.csv: All Phase 2 trials (long format)
#   - phase3_trials.csv: All Phase 3 trials (long format)
#   - demographics.csv: All demographics responses
#   - surveys.csv: Technical check and user feedback responses

# ============================================================================
# LOAD PACKAGES
# ============================================================================

library(jsonlite)
library(dplyr)
library(tidyr)
library(purrr)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Firebase configuration - update with your project details
FIREBASE_URL <- "https://socialexposuretheory2026-default-rtdb.firebaseio.com"
DATABASE_PATH <- "/participants.json"

# Output directory
OUTPUT_DIR <- "data/csv_exports"
dir.create(OUTPUT_DIR, recursive = TRUE, showWarnings = FALSE)

# ============================================================================
# DOWNLOAD DATA FROM FIREBASE
# ============================================================================

download_firebase_data <- function() {
  url <- paste0(FIREBASE_URL, DATABASE_PATH)

  cat("Downloading data from", url, "...\n")
  data <- fromJSON(url)

  cat("✓ Downloaded data for", length(data), "participants\n")
  return(data)
}

# ============================================================================
# CONVERT TO CSV
# ============================================================================

flatten_participants <- function(firebase_data) {
  # Extract participant-level data
  participants <- map_dfr(names(firebase_data), function(pid) {
    pdata <- firebase_data[[pid]]
    metadata <- pdata$metadata
    summary <- pdata$summary

    tibble(
      participant_id = pid,
      # Metadata
      internal_id = metadata$internal_id %||% NA,
      prolific_pid = metadata$prolific_pid %||% NA,
      study_id = metadata$study_id %||% NA,
      session_id = metadata$session_id %||% NA,
      condition = metadata$condition %||% NA,
      majority_group = metadata$majority_group %||% NA,
      informed = metadata$informed %||% NA,
      timestamp = metadata$timestamp %||% NA,
      debug_mode = metadata$debug_mode %||% NA,
      # Summary scores
      phase1_score = summary$phase1_score %||% NA,
      phase2_score = summary$phase2_score %||% NA,
      total_score = summary$total_score %||% NA,
      phase1_trials_count = summary$phase1_trials_count %||% NA,
      phase2_trials_count = summary$phase2_trials_count %||% NA,
      phase3_trials_count = summary$phase3_trials_count %||% NA
    )
  })

  return(participants)
}

flatten_demographics <- function(firebase_data) {
  # Extract demographics
  demographics <- map_dfr(names(firebase_data), function(pid) {
    pdata <- firebase_data[[pid]]
    demo <- pdata$demographics

    if (!is.null(demo)) {
      as_tibble(demo) %>%
        mutate(participant_id = pid, .before = 1)
    } else {
      NULL
    }
  })

  return(demographics)
}

flatten_trials <- function(firebase_data, phase) {
  # Extract trial data for specific phase
  trials <- map_dfr(names(firebase_data), function(pid) {
    pdata <- firebase_data[[pid]]
    phase_trials <- pdata$trials[[paste0("phase", phase)]]

    if (!is.null(phase_trials) && length(phase_trials) > 0) {
      as_tibble(phase_trials) %>%
        mutate(participant_id = pid, .before = 1)
    } else {
      NULL
    }
  })

  return(trials)
}

flatten_surveys <- function(firebase_data) {
  # Extract survey responses
  surveys <- map_dfr(names(firebase_data), function(pid) {
    pdata <- firebase_data[[pid]]
    survey_data <- pdata$surveys

    tibble(
      participant_id = pid,
      # Technical check
      images_loaded = survey_data$technical_check$images_loaded %||% NA,
      technical_difficulties = survey_data$technical_check$technical_difficulties %||% NA,
      technical_difficulties_details = survey_data$technical_check$technical_difficulties_details %||% NA,
      # User feedback
      clarity_rating = survey_data$user_feedback$clarity_rating %||% NA,
      length_rating = survey_data$user_feedback$length_rating %||% NA,
      suggestions = survey_data$user_feedback$suggestions %||% NA
    )
  })

  return(surveys)
}

# ============================================================================
# MAIN EXPORT FUNCTION
# ============================================================================

export_all <- function() {
  # Download data
  firebase_data <- download_firebase_data()

  # Export participants
  cat("\nExporting participants.csv...\n")
  df_participants <- flatten_participants(firebase_data)
  write.csv(df_participants, file.path(OUTPUT_DIR, "participants.csv"), row.names = FALSE)
  cat("✓ Saved", nrow(df_participants), "participants\n")

  # Export demographics
  cat("\nExporting demographics.csv...\n")
  df_demographics <- flatten_demographics(firebase_data)
  write.csv(df_demographics, file.path(OUTPUT_DIR, "demographics.csv"), row.names = FALSE)
  cat("✓ Saved", nrow(df_demographics), "demographics responses\n")

  # Export Phase 1 trials
  cat("\nExporting phase1_trials.csv...\n")
  df_phase1 <- flatten_trials(firebase_data, phase = 1)
  write.csv(df_phase1, file.path(OUTPUT_DIR, "phase1_trials.csv"), row.names = FALSE)
  cat("✓ Saved", nrow(df_phase1), "Phase 1 trials\n")

  # Export Phase 2 trials
  cat("\nExporting phase2_trials.csv...\n")
  df_phase2 <- flatten_trials(firebase_data, phase = 2)
  write.csv(df_phase2, file.path(OUTPUT_DIR, "phase2_trials.csv"), row.names = FALSE)
  cat("✓ Saved", nrow(df_phase2), "Phase 2 trials\n")

  # Export Phase 3 trials
  cat("\nExporting phase3_trials.csv...\n")
  df_phase3 <- flatten_trials(firebase_data, phase = 3)
  write.csv(df_phase3, file.path(OUTPUT_DIR, "phase3_trials.csv"), row.names = FALSE)
  cat("✓ Saved", nrow(df_phase3), "Phase 3 trials\n")

  # Export surveys
  cat("\nExporting surveys.csv...\n")
  df_surveys <- flatten_surveys(firebase_data)
  write.csv(df_surveys, file.path(OUTPUT_DIR, "surveys.csv"), row.names = FALSE)
  cat("✓ Saved", nrow(df_surveys), "survey responses\n")

  cat("\n✅ All files exported to:", normalizePath(OUTPUT_DIR), "\n")

  # Print summary statistics
  cat("\n", paste(rep("=", 60), collapse = ""), "\n")
  cat("SUMMARY\n")
  cat(paste(rep("=", 60), collapse = ""), "\n")
  cat("Total participants:", nrow(df_participants), "\n")
  cat("Participants with demographics:", nrow(df_demographics), "\n")
  cat("Total Phase 1 trials:", nrow(df_phase1), "\n")
  cat("Total Phase 2 trials:", nrow(df_phase2), "\n")
  cat("Total Phase 3 trials:", nrow(df_phase3), "\n")
  cat("Survey responses:", nrow(df_surveys), "\n")
}

# ============================================================================
# RUN (uncomment to auto-run)
# ============================================================================

# export_all()
