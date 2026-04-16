CREATE DATABASE  IF NOT EXISTS `hrms_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `hrms_db`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: hrms_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `asset_assignments`
--

DROP TABLE IF EXISTS `asset_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `assigned_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `condition` enum('EXCELLENT','GOOD','FAIR','POOR','DAMAGED') NOT NULL,
  `purpose` text,
  `remarks` text,
  `status` enum('ACTIVE','RETURNED','TRANSFERRED') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `asset_assignments_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_assignments_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset_transfers`
--

DROP TABLE IF EXISTS `asset_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int NOT NULL,
  `from_employee_id` int NOT NULL,
  `to_employee_id` int NOT NULL,
  `transfer_date` date NOT NULL,
  `reason` text,
  `condition` enum('EXCELLENT','GOOD','FAIR','POOR','DAMAGED') NOT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `from_employee_id` (`from_employee_id`),
  KEY `to_employee_id` (`to_employee_id`),
  CONSTRAINT `asset_transfers_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_transfers_ibfk_2` FOREIGN KEY (`from_employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `asset_transfers_ibfk_3` FOREIGN KEY (`to_employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('IT_EQUIPMENT','FURNITURE','VEHICLE','OFFICE_EQUIPMENT','OTHER') NOT NULL,
  `type` varchar(255) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_price` decimal(10,2) DEFAULT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `invoice_number` varchar(255) DEFAULT NULL,
  `current_value` decimal(10,2) DEFAULT NULL,
  `depreciation_method` enum('STRAIGHT_LINE','DECLINING_BALANCE','NONE') DEFAULT 'STRAIGHT_LINE',
  `depreciation_rate` decimal(5,2) DEFAULT 10.00,
  `useful_life_years` int DEFAULT 5,
  `last_depreciation_date` date DEFAULT NULL,
  `condition` enum('EXCELLENT','GOOD','FAIR','POOR','DAMAGED') NOT NULL,
  `status` enum('AVAILABLE','ASSIGNED','UNDER_MAINTENANCE','DISPOSED','LOST') NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `assignment_date` date DEFAULT NULL,
  `warranty_expiry` date DEFAULT NULL,
  `description` text,
  `specifications` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_id` (`asset_id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `attendance_records`
--

DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `status` enum('PRESENT','ABSENT','HALF_DAY','LATE','WORK_FROM_HOME') NOT NULL,
  `remarks` text,
  `location_latitude` decimal(10,8) DEFAULT NULL,
  `location_longitude` decimal(11,8) DEFAULT NULL,
  `location_address` text,
  `location_accuracy` int DEFAULT NULL,
  `biometric_fingerprint_id` varchar(255) DEFAULT NULL,
  `biometric_face_id` varchar(255) DEFAULT NULL,
  `biometric_confidence` int DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `device_ip_address` varchar(255) DEFAULT NULL,
  `device_user_agent` text,
  `work_location_type` enum('OFFICE','HOME','CLIENT_SITE','FIELD') NOT NULL,
  `is_manual_entry` tinyint(1) DEFAULT '0',
  `approved_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `attendance_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `banks`
--

DROP TABLE IF EXISTS `banks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ifsc_code` varchar(50) NOT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `ifsc_code` (`ifsc_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `biometric_devices`
--

DROP TABLE IF EXISTS `biometric_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biometric_devices` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` enum('ONLINE','OFFLINE','MAINTENANCE') NOT NULL,
  `last_sync` timestamp NULL DEFAULT NULL,
  `employee_count` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `birthday_reminders`
--

DROP TABLE IF EXISTS `birthday_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `birthday_reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `birth_date` date NOT NULL,
  `days_until_birthday` int NOT NULL,
  `notification_sent` tinyint(1) DEFAULT '0',
  `manager_notified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `birthday_reminders_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `resume_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `claim_documents`
--

DROP TABLE IF EXISTS `claim_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim_documents` (
  `claim_id` int NOT NULL,
  `document_path` varchar(255) NOT NULL,
  PRIMARY KEY (`claim_id`,`document_path`),
  CONSTRAINT `claim_documents_ibfk_1` FOREIGN KEY (`claim_id`) REFERENCES `insurance_claims` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `department_id` int NOT NULL,
  `level` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `designations_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `is_mandatory` tinyint(1) DEFAULT '0',
  `allowed_extensions` varchar(255) DEFAULT NULL,
  `max_file_size_mb` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_documents`
--

DROP TABLE IF EXISTS `employee_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `document_type_id` int NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `document_type_id` (`document_type_id`),
  CONSTRAINT `employee_documents_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_documents_ibfk_2` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_qualifications`
--

DROP TABLE IF EXISTS `employee_qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_qualifications` (
  `employee_id` int NOT NULL,
  `qualification_id` int NOT NULL,
  PRIMARY KEY (`employee_id`,`qualification_id`),
  KEY `qualification_id` (`qualification_id`),
  CONSTRAINT `employee_qualifications_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_qualifications_ibfk_2` FOREIGN KEY (`qualification_id`) REFERENCES `qualifications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_salary`
--

DROP TABLE IF EXISTS `employee_salary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `salary_component_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `salary_component_id` (`salary_component_id`),
  CONSTRAINT `employee_salary_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `employee_salary_ibfk_2` FOREIGN KEY (`salary_component_id`) REFERENCES `salary_components` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_training`
--

DROP TABLE IF EXISTS `employee_training`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_training` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `training_program_id` int NOT NULL,
  `status` enum('ENROLLED','IN_PROGRESS','COMPLETED') DEFAULT 'ENROLLED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `training_program_id` (`training_program_id`),
  CONSTRAINT `employee_training_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `employee_training_ibfk_2` FOREIGN KEY (`training_program_id`) REFERENCES `training_programs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `work_email` varchar(255) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `manpower_type_id` int NOT NULL,
  `department_id` int NOT NULL,
  `designation_id` int NOT NULL,
  `work_location_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `joining_date` date NOT NULL,
  `status` enum('ACTIVE','INACTIVE','TERMINATED','RESIGNED') DEFAULT 'ACTIVE',
  `bank_id` int DEFAULT NULL,
  `account_number` varchar(255) DEFAULT NULL,
  `payment_mode_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `manpower_type_id` (`manpower_type_id`),
  KEY `department_id` (`department_id`),
  KEY `designation_id` (`designation_id`),
  KEY `work_location_id` (`work_location_id`),
  KEY `shift_id` (`shift_id`),
  KEY `bank_id` (`bank_id`),
  KEY `payment_mode_id` (`payment_mode_id`),
  KEY `customer_id` (`customer_id`),
  KEY `project_id` (`project_id`),
  KEY `idx_work_email` (`work_email`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`manpower_type_id`) REFERENCES `manpower_types` (`id`),
  CONSTRAINT `employees_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `employees_ibfk_3` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`),
  CONSTRAINT `employees_ibfk_4` FOREIGN KEY (`work_location_id`) REFERENCES `work_locations` (`id`),
  CONSTRAINT `employees_ibfk_5` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`),
  CONSTRAINT `employees_ibfk_6` FOREIGN KEY (`bank_id`) REFERENCES `banks` (`id`),
  CONSTRAINT `employees_ibfk_7` FOREIGN KEY (`payment_mode_id`) REFERENCES `payment_modes` (`id`),
  CONSTRAINT `employees_ibfk_8` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `employees_ibfk_9` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exit_asset_handovers`
--

DROP TABLE IF EXISTS `exit_asset_handovers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exit_asset_handovers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exit_process_id` int NOT NULL,
  `asset_type` varchar(255) NOT NULL,
  `asset_name` varchar(255) NOT NULL,
  `asset_id` varchar(255) DEFAULT NULL,
  `condition` enum('GOOD','FAIR','DAMAGED') NOT NULL,
  `is_returned` tinyint(1) DEFAULT '0',
  `return_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `exit_process_id` (`exit_process_id`),
  CONSTRAINT `exit_asset_handovers_ibfk_1` FOREIGN KEY (`exit_process_id`) REFERENCES `exit_processes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exit_formalities`
--

DROP TABLE IF EXISTS `exit_formalities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exit_formalities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exit_process_id` int NOT NULL,
  `category` varchar(255) NOT NULL,
  `item` varchar(255) NOT NULL,
  `responsible` varchar(255) NOT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `exit_process_id` (`exit_process_id`),
  CONSTRAINT `exit_formalities_ibfk_1` FOREIGN KEY (`exit_process_id`) REFERENCES `exit_processes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exit_interviews`
--

DROP TABLE IF EXISTS `exit_interviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exit_interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exit_process_id` int NOT NULL,
  `conducted` tinyint(1) DEFAULT '0',
  `conducted_by` varchar(255) DEFAULT NULL,
  `interview_date` date DEFAULT NULL,
  `feedback` text,
  `rating` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `exit_process_id` (`exit_process_id`),
  CONSTRAINT `exit_interviews_ibfk_1` FOREIGN KEY (`exit_process_id`) REFERENCES `exit_processes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exit_processes`
--

DROP TABLE IF EXISTS `exit_processes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exit_processes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `resignation_date` date NOT NULL,
  `last_working_date` date NOT NULL,
  `exit_type` enum('RESIGNATION','TERMINATION','RETIREMENT','END_OF_CONTRACT') NOT NULL,
  `reason` text NOT NULL,
  `notice_period_days` int NOT NULL,
  `status` enum('INITIATED','IN_PROGRESS','PENDING_CLEARANCE','COMPLETED') NOT NULL,
  `current_step` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `exit_processes_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_requests`
--

DROP TABLE IF EXISTS `expense_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `expense_category_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `expense_category_id` (`expense_category_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `expense_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `expense_requests_ibfk_2` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`),
  CONSTRAINT `expense_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `feedback` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `reviewer_id` (`reviewer_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ff_settlement_components`
--

DROP TABLE IF EXISTS `ff_settlement_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ff_settlement_components` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ff_settlement_id` int NOT NULL,
  `component_name` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text,
  `type` enum('CREDIT','DEBIT') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ff_settlement_id` (`ff_settlement_id`),
  CONSTRAINT `ff_settlement_components_ibfk_1` FOREIGN KEY (`ff_settlement_id`) REFERENCES `ff_settlements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ff_settlements`
--

DROP TABLE IF EXISTS `ff_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ff_settlements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exit_process_id` int NOT NULL,
  `basic_salary` decimal(15,2) NOT NULL,
  `pending_salary` decimal(15,2) NOT NULL,
  `leave_encashment` decimal(15,2) NOT NULL,
  `gratuity` decimal(15,2) NOT NULL,
  `bonus` decimal(15,2) NOT NULL,
  `other_allowances` decimal(15,2) NOT NULL,
  `deductions` decimal(15,2) NOT NULL,
  `net_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exit_process_id` (`exit_process_id`),
  CONSTRAINT `ff_settlements_ibfk_1` FOREIGN KEY (`exit_process_id`) REFERENCES `exit_processes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `generated_letters`
--

DROP TABLE IF EXISTS `generated_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generated_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `generated_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `content` text NOT NULL,
  `additional_content` text,
  `recipient_email` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `status` enum('GENERATED','SENT','SAVED','DOWNLOADED') DEFAULT 'GENERATED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `generated_letters_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `letter_templates` (`id`),
  CONSTRAINT `generated_letters_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `goals`
--

DROP TABLE IF EXISTS `goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gratuity_records`
--

DROP TABLE IF EXISTS `gratuity_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gratuity_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `joining_date` date NOT NULL,
  `current_salary` decimal(15,2) NOT NULL,
  `service_years` decimal(5,2) NOT NULL,
  `eligible_amount` decimal(15,2) NOT NULL,
  `calculation_method` varchar(255) NOT NULL,
  `last_calculation_date` date NOT NULL,
  `status` enum('ELIGIBLE','NOT_ELIGIBLE','PAID') NOT NULL,
  `payment_date` date DEFAULT NULL,
  `actual_amount` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `gratuity_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insurance_claims`
--

DROP TABLE IF EXISTS `insurance_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_claims` (
  `id` int NOT NULL AUTO_INCREMENT,
  `policy_id` int NOT NULL,
  `claim_number` varchar(255) NOT NULL,
  `claim_date` date NOT NULL,
  `claim_amount` decimal(15,2) NOT NULL,
  `approved_amount` decimal(15,2) DEFAULT NULL,
  `claim_type` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','SETTLED') NOT NULL,
  `submitted_date` date NOT NULL,
  `settlement_date` date DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `claim_number` (`claim_number`),
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `insurance_claims_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `insurance_policies`
--

DROP TABLE IF EXISTS `insurance_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_policies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `policy_type` enum('MEDICAL','LIFE','ACCIDENT','DISABILITY') NOT NULL,
  `policy_number` varchar(255) NOT NULL,
  `insurance_provider` varchar(255) NOT NULL,
  `policy_name` varchar(255) NOT NULL,
  `coverage_amount` decimal(15,2) NOT NULL,
  `premium_amount` decimal(10,2) NOT NULL,
  `premium_frequency` enum('MONTHLY','QUARTERLY','ANNUALLY') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('ACTIVE','EXPIRED','CANCELLED','PENDING') NOT NULL,
  `is_company_provided` tinyint(1) DEFAULT '0',
  `employee_contribution` decimal(10,2) DEFAULT NULL,
  `company_contribution` decimal(10,2) DEFAULT NULL,
  `deductible` decimal(10,2) DEFAULT NULL,
  `co_payment` decimal(5,2) DEFAULT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `policy_number` (`policy_number`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `insurance_policies_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `interviews`
--

DROP TABLE IF EXISTS `interviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidate_id` int NOT NULL,
  `job_opening_id` int NOT NULL,
  `interviewer_id` int NOT NULL,
  `interview_date` datetime NOT NULL,
  `feedback` text,
  `status` enum('SCHEDULED','COMPLETED','CANCELLED') DEFAULT 'SCHEDULED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `candidate_id` (`candidate_id`),
  KEY `job_opening_id` (`job_opening_id`),
  KEY `interviewer_id` (`interviewer_id`),
  CONSTRAINT `interviews_ibfk_1` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`),
  CONSTRAINT `interviews_ibfk_2` FOREIGN KEY (`job_opening_id`) REFERENCES `job_openings` (`id`),
  CONSTRAINT `interviews_ibfk_3` FOREIGN KEY (`interviewer_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `job_openings`
--

DROP TABLE IF EXISTS `job_openings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_openings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `department_id` int NOT NULL,
  `status` enum('OPEN','CLOSED') DEFAULT 'OPEN',
  `assigned_to` int DEFAULT NULL,
  `progress` int DEFAULT 0,
  `task_status` enum('PENDING','IN_PROGRESS','COMPLETED','ON_HOLD') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `department_id` (`department_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `job_openings_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `job_openings_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leave_balances`
--

DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_balances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `balance` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `leave_type_id` (`leave_type_id`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `leave_type_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `letter_custom_variables`
--

DROP TABLE IF EXISTS `letter_custom_variables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `letter_custom_variables` (
  `letter_id` int NOT NULL,
  `variable_name` varchar(255) NOT NULL,
  `variable_value` text NOT NULL,
  PRIMARY KEY (`letter_id`,`variable_name`),
  CONSTRAINT `letter_custom_variables_ibfk_1` FOREIGN KEY (`letter_id`) REFERENCES `generated_letters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `letter_template_variables`
--

DROP TABLE IF EXISTS `letter_template_variables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `letter_template_variables` (
  `template_id` int NOT NULL,
  `variable_name` varchar(255) NOT NULL,
  PRIMARY KEY (`template_id`,`variable_name`),
  CONSTRAINT `letter_template_variables_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `letter_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `letter_templates`
--

DROP TABLE IF EXISTS `letter_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `letter_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('APPOINTMENT','OFFER','RECOMMENDATION','EXPERIENCE','RELIEVING','WARNING','APPRECIATION') NOT NULL,
  `category` varchar(255) NOT NULL,
  `template_content` text NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `location_settings`
--

DROP TABLE IF EXISTS `location_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_settings` (
  `id` int NOT NULL,
  `allowed_radius` int NOT NULL,
  `require_biometric` tinyint(1) NOT NULL,
  `allow_work_from_home` tinyint(1) NOT NULL,
  `allow_field_work` tinyint(1) NOT NULL,
  `working_hours_start` time NOT NULL,
  `working_hours_end` time NOT NULL,
  `late_threshold_minutes` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manpower_types`
--

DROP TABLE IF EXISTS `manpower_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manpower_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_history`
--

DROP TABLE IF EXISTS `notification_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `template_id` int NOT NULL,
  `template_name` varchar(255) NOT NULL,
  `sent_date` date NOT NULL,
  `sent_time` time NOT NULL,
  `channel` enum('EMAIL','SMS','IN_APP') NOT NULL,
  `status` enum('SENT','FAILED','PENDING') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_recipients_history`
--

DROP TABLE IF EXISTS `notification_recipients_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_recipients_history` (
  `history_id` int NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  PRIMARY KEY (`history_id`,`recipient_email`),
  CONSTRAINT `notification_recipients_history_ibfk_1` FOREIGN KEY (`history_id`) REFERENCES `notification_history` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_settings`
--

DROP TABLE IF EXISTS `notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings` (
  `id` int NOT NULL,
  `birthday_enabled` tinyint(1) DEFAULT '1',
  `birthday_days_before` int NOT NULL,
  `birthday_notify_managers` tinyint(1) DEFAULT '0',
  `birthday_notify_hr` tinyint(1) DEFAULT '0',
  `anniversary_enabled` tinyint(1) DEFAULT '1',
  `anniversary_days_before` int NOT NULL,
  `anniversary_notify_managers` tinyint(1) DEFAULT '0',
  `leave_enabled` tinyint(1) DEFAULT '1',
  `leave_pending_approval_hours` int DEFAULT NULL,
  `leave_unused_leave_months` int DEFAULT NULL,
  `policy_updates_enabled` tinyint(1) DEFAULT '1',
  `policy_updates_require_acknowledgment` tinyint(1) DEFAULT '0',
  `policy_updates_reminder_frequency` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_settings_channels`
--

DROP TABLE IF EXISTS `notification_settings_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings_channels` (
  `setting_id` int NOT NULL,
  `setting_type` enum('BIRTHDAY','ANNIVERSARY','LEAVE','POLICY_UPDATE') NOT NULL,
  `channel` enum('EMAIL','SMS','IN_APP') NOT NULL,
  PRIMARY KEY (`setting_id`,`setting_type`,`channel`),
  CONSTRAINT `notification_settings_channels_ibfk_1` FOREIGN KEY (`setting_id`) REFERENCES `notification_settings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notification_templates`
--

DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('BIRTHDAY','ANNIVERSARY','LEAVE_REMINDER','POLICY_UPDATE','TRAINING_REMINDER','CUSTOM') NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `recipients` enum('ALL','MANAGERS','HR','SPECIFIC') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `schedule_frequency` enum('DAILY','WEEKLY','MONTHLY','YEARLY','ONE_TIME') DEFAULT NULL,
  `schedule_time` time DEFAULT NULL,
  `schedule_days_before` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `office_locations`
--

DROP TABLE IF EXISTS `office_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `office_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `radius` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_modes`
--

DROP TABLE IF EXISTS `payment_modes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_modes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payslips`
--

DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `gross_salary` decimal(10,2) NOT NULL,
  `net_salary` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `payslips_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `performance_reviews`
--

DROP TABLE IF EXISTS `performance_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `performance_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `review_date` date NOT NULL,
  `rating` int NOT NULL,
  `comments` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `reviewer_id` (`reviewer_id`),
  CONSTRAINT `performance_reviews_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `performance_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `policy_beneficiaries`
--

DROP TABLE IF EXISTS `policy_beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policy_beneficiaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `policy_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `relationship` varchar(100) NOT NULL,
  `percentage` int NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `policy_beneficiaries_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `policy_family_coverage`
--

DROP TABLE IF EXISTS `policy_family_coverage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policy_family_coverage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `policy_id` int NOT NULL,
  `member_name` varchar(255) NOT NULL,
  `relationship` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `coverage_amount` decimal(15,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `policy_id` (`policy_id`),
  CONSTRAINT `policy_family_coverage_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `insurance_policies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `qualifications`
--

DROP TABLE IF EXISTS `qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qualifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `level` enum('SCHOOL','DIPLOMA','UNDERGRADUATE','POSTGRADUATE','DOCTORATE','PROFESSIONAL') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_components`
--

DROP TABLE IF EXISTS `salary_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_components` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('EARNING','DEDUCTION') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_channels`
--

DROP TABLE IF EXISTS `template_channels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_channels` (
  `template_id` int NOT NULL,
  `channel` enum('EMAIL','SMS','IN_APP') NOT NULL,
  PRIMARY KEY (`template_id`,`channel`),
  CONSTRAINT `template_channels_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `notification_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_specific_recipients`
--

DROP TABLE IF EXISTS `template_specific_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_specific_recipients` (
  `template_id` int NOT NULL,
  `employee_id` int NOT NULL,
  PRIMARY KEY (`template_id`,`employee_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `template_specific_recipients_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `notification_templates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `template_specific_recipients_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `template_variables`
--

DROP TABLE IF EXISTS `template_variables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `template_variables` (
  `template_id` int NOT NULL,
  `variable_name` varchar(255) NOT NULL,
  PRIMARY KEY (`template_id`,`variable_name`),
  CONSTRAINT `template_variables_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `notification_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `training_programs`
--

DROP TABLE IF EXISTS `training_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `untitled_table_62`
--

DROP TABLE IF EXISTS `untitled_table_62`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `untitled_table_62` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_locations`
--

DROP TABLE IF EXISTS `work_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` enum('employee','manager','admin') NOT NULL DEFAULT 'employee',
  `password_hash` varchar(255) NOT NULL,
  `employee_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `employee_id` (`employee_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `manual_attendance_requests`
--

DROP TABLE IF EXISTS `manual_attendance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_attendance_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `reason` text,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `manual_attendance_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `manual_attendance_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `regularization_requests`
--

DROP TABLE IF EXISTS `regularization_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regularization_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `attendance_id` int NOT NULL,
  `requested_change` text NOT NULL,
  `reason` text,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `attendance_id` (`attendance_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `regularization_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `regularization_requests_ibfk_2` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`),
  CONSTRAINT `regularization_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `geo_location_logs`
--

DROP TABLE IF EXISTS `geo_location_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `geo_location_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `attendance_id` int DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text,
  `accuracy` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `attendance_id` (`attendance_id`),
  CONSTRAINT `geo_location_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `geo_location_logs_ibfk_2` FOREIGN KEY (`attendance_id`) REFERENCES `attendance_records` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `actor_id` int DEFAULT NULL,
  `actor_role` enum('employee','manager','admin') DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(100) NOT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset_history`
--

DROP TABLE IF EXISTS `asset_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int NOT NULL,
  `action_type` enum('CREATED','UPDATED','ASSIGNED','RETURNED','TRANSFERRED','MAINTENANCE','CONDITION_CHANGED','STATUS_CHANGED','DISPOSED','DELETED') NOT NULL,
  `action_by` int DEFAULT NULL,
  `action_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `description` text,
  `remarks` text,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `action_type` (`action_type`),
  KEY `action_date` (`action_date`),
  KEY `idx_asset_history_asset_action` (`asset_id`,`action_type`),
  CONSTRAINT `asset_history_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_history_ibfk_2` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset_photos`
--

DROP TABLE IF EXISTS `asset_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int NOT NULL,
  `photo_path` varchar(500) NOT NULL,
  `photo_name` varchar(255) NOT NULL,
  `photo_size` int DEFAULT NULL,
  `photo_type` varchar(50) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `is_primary` (`is_primary`),
  CONSTRAINT `asset_photos_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_photos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset_id_sequence`
--

DROP TABLE IF EXISTS `asset_id_sequence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_id_sequence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` int NOT NULL,
  `sequence_value` int NOT NULL DEFAULT '0',
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `appraisal_categories`
--

DROP TABLE IF EXISTS `appraisal_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appraisal_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kpis`
--

DROP TABLE IF EXISTS `kpis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `period_year` int NOT NULL,
  `period_month` int NOT NULL,
  `appraisal_category_id` int NOT NULL,
  `status` enum('DRAFT','SUBMITTED','MANAGER_REVIEW','DEPT_HEAD_REVIEW','HR_REVIEW','CEO_APPROVAL','COMPLETED','RETURNED_FOR_CHANGES') DEFAULT 'DRAFT',
  `current_reviewer_role` enum('EMPLOYEE','MANAGER','DEPT_HEAD','HR','CEO') DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_period` (`employee_id`,`period_year`,`period_month`),
  KEY `idx_status` (`status`),
  KEY `idx_employee` (`employee_id`),
  KEY `appraisal_category_id` (`appraisal_category_id`),
  CONSTRAINT `kpis_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `kpis_ibfk_2` FOREIGN KEY (`appraisal_category_id`) REFERENCES `appraisal_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kpi_items`
--

DROP TABLE IF EXISTS `kpi_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kpi_id` int NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `weight` int NOT NULL DEFAULT '0',
  `employee_target` text NOT NULL,
  `employee_self_score` decimal(5,2) DEFAULT NULL,
  `manager_score` decimal(5,2) DEFAULT NULL,
  `dept_head_score` decimal(5,2) DEFAULT NULL,
  `hr_score` decimal(5,2) DEFAULT NULL,
  `ceo_score` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kpi` (`kpi_id`),
  CONSTRAINT `kpi_items_ibfk_1` FOREIGN KEY (`kpi_id`) REFERENCES `kpis` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kpi_reviews`
--

DROP TABLE IF EXISTS `kpi_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kpi_id` int NOT NULL,
  `reviewer_id` int NOT NULL,
  `reviewer_role` enum('EMPLOYEE','MANAGER','DEPT_HEAD','HR','CEO') NOT NULL,
  `action` enum('SUBMITTED','APPROVED','RETURNED') NOT NULL,
  `from_status` varchar(50) NOT NULL,
  `to_status` varchar(50) NOT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `overall_comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kpi` (`kpi_id`),
  KEY `idx_reviewer` (`reviewer_id`),
  CONSTRAINT `kpi_reviews_ibfk_1` FOREIGN KEY (`kpi_id`) REFERENCES `kpis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kpi_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kpi_comments`
--

DROP TABLE IF EXISTS `kpi_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kpi_id` int NOT NULL,
  `author_id` int NOT NULL,
  `author_role` enum('EMPLOYEE','MANAGER','DEPT_HEAD','HR','CEO') NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kpi` (`kpi_id`),
  KEY `idx_author` (`author_id`),
  CONSTRAINT `kpi_comments_ibfk_1` FOREIGN KEY (`kpi_id`) REFERENCES `kpis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kpi_comments_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kpi_activity_logs`
--

DROP TABLE IF EXISTS `kpi_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kpi_id` int NOT NULL,
  `actor_id` int NOT NULL,
  `actor_role` enum('EMPLOYEE','MANAGER','DEPT_HEAD','HR','CEO') NOT NULL,
  `type` enum('CREATED','UPDATED','SUBMITTED','APPROVED','RETURNED','COMMENT') NOT NULL,
  `details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kpi` (`kpi_id`),
  KEY `idx_actor` (`actor_id`),
  KEY `idx_type` (`type`),
  CONSTRAINT `kpi_activity_logs_ibfk_1` FOREIGN KEY (`kpi_id`) REFERENCES `kpis` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kpi_activity_logs_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Additional indexes for assets table
--

-- CREATE INDEX `idx_assets_category` ON `assets` (`category`);
-- CREATE INDEX `idx_assets_status` ON `assets` (`status`);
-- CREATE INDEX `idx_assets_assigned_to` ON `assets` (`assigned_to`);
-- Note: These indexes are already defined in the assets table CREATE statement above

--
-- Insert default appraisal categories
--

INSERT IGNORE INTO `appraisal_categories` (`name`, `description`) VALUES
('Performance Review', 'Quarterly performance evaluation'),
('Annual Appraisal', 'Year-end comprehensive assessment'),
('Project-Based', 'Project-specific KPI tracking'),
('Monthly Goals', 'Monthly goal achievement review');

--
-- Table structure for table `job_activities`
--

DROP TABLE IF EXISTS `job_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_opening_id` int NOT NULL,
  `actor_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `job_opening_id` (`job_opening_id`),
  KEY `actor_id` (`actor_id`),
  CONSTRAINT `job_activities_ibfk_1` FOREIGN KEY (`job_opening_id`) REFERENCES `job_openings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `job_activities_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(500) NOT NULL,
  `description` text,
  `assigned_to` int NOT NULL,
  `created_by` int NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CLOSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_deadline` (`deadline`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_comments`
--

DROP TABLE IF EXISTS `task_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `task_comments_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_files`
--

DROP TABLE IF EXISTS `task_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `file_name` varchar(500) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `file_size` int DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `task_files_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_files_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_activity_log`
--

DROP TABLE IF EXISTS `task_activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_activity_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `user_id` int NOT NULL,
  `activity_type` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `comment` text,
  `attachment_path` varchar(1000) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `task_activity_log_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_activity_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- ============================================================================
-- MIGRATION SCRIPTS - ALTER TABLE COMMANDS FOR EXISTING DATABASES
-- ============================================================================
-- Run these commands if you have an existing database and need to apply updates
-- These are safe to run multiple times (they check for existence before adding)

-- Migration: Add work_email column to employees table
-- Date: 2026-01-29
-- Description: Adds a new work_email column to store employee's work email address
-- Note: For fresh installations, the work_email column is already included in the employees table above
-- For existing databases, uncomment and run the following commands:

/*
-- Check if column exists before adding
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'hrms_db'
  AND TABLE_NAME = 'employees'
  AND COLUMN_NAME = 'work_email';

SET @query = IF(@col_exists = 0,
  'ALTER TABLE employees ADD COLUMN work_email VARCHAR(255) DEFAULT NULL AFTER email',
  'SELECT "Column work_email already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for work_email
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'hrms_db'
  AND TABLE_NAME = 'employees'
  AND INDEX_NAME = 'idx_work_email';

SET @query = IF(@index_exists = 0,
  'CREATE INDEX idx_work_email ON employees(work_email)',
  'SELECT "Index idx_work_email already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
*/

-- Note: work_email is nullable and does not have a unique constraint
-- This allows multiple employees to have no work email or share work emails if needed

-- ============================================================================
-- OPTIONAL: DUMMY/TEST DATA
-- ============================================================================
-- Uncomment the following section if you want to insert test data for development

/*
-- Ensure we have some master data first (if not already present)
INSERT IGNORE INTO manpower_types (name, description, is_active) VALUES
('Full Time', 'Full-time employees', 1),
('Part Time', 'Part-time employees', 1),
('Contract', 'Contract employees', 1);

INSERT IGNORE INTO departments (name, code, description, is_active) VALUES
('IT', 'IT', 'Information Technology', 1),
('HR', 'HR', 'Human Resources', 1),
('Finance', 'FIN', 'Finance Department', 1),
('Sales', 'SAL', 'Sales Department', 1),
('Operations', 'OPS', 'Operations Department', 1);

INSERT IGNORE INTO designations (name, code, description, department_id, level, is_active) VALUES
('Software Engineer', 'SE', 'Software Engineer', (SELECT id FROM departments WHERE name = 'IT' LIMIT 1), 'L2', 1),
('Senior Software Engineer', 'SSE', 'Senior Software Engineer', (SELECT id FROM departments WHERE name = 'IT' LIMIT 1), 'L3', 1),
('HR Manager', 'HRM', 'HR Manager', (SELECT id FROM departments WHERE name = 'HR' LIMIT 1), 'L4', 1),
('Accountant', 'ACC', 'Accountant', (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1), 'L2', 1),
('Sales Executive', 'SALEX', 'Sales Executive', (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1), 'L2', 1);

INSERT IGNORE INTO work_locations (name, code, region, address, city, state, pincode, is_active) VALUES
('Head Office', 'HQ', 'North', '123 Business Park', 'Delhi', 'Delhi', '110001', 1),
('Branch Office', 'BR1', 'South', '456 Tech Street', 'Bangalore', 'Karnataka', '560001', 1);

INSERT IGNORE INTO shifts (name, start_time, end_time, description, is_active) VALUES
('Morning Shift', '09:00:00', '18:00:00', 'Standard morning shift', 1),
('Night Shift', '18:00:00', '02:00:00', 'Night shift', 1),
('Flexible', '10:00:00', '19:00:00', 'Flexible timing', 1);

-- Insert Dummy Employees
INSERT INTO employees (
  employee_id, first_name, middle_name, last_name, gender, date_of_birth, mobile, email,
  address, city, state, pincode, manpower_type_id, department_id, designation_id,
  work_location_id, shift_id, joining_date, status, is_active
) VALUES
('EMP001', 'John', NULL, 'Doe', 'MALE', '1990-05-15', '9876543210', 'john.doe@company.com',
 '123 Main Street', 'Delhi', 'Delhi', '110001',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'IT' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'Software Engineer' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
 '2023-01-15', 'ACTIVE', 1),

('EMP002', 'Jane', 'Marie', 'Smith', 'FEMALE', '1992-08-20', '9876543211', 'jane.smith@company.com',
 '456 Park Avenue', 'Delhi', 'Delhi', '110002',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'HR' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'HR Manager' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
 '2022-06-01', 'ACTIVE', 1),

('EMP003', 'Michael', NULL, 'Johnson', 'MALE', '1988-12-10', '9876543212', 'michael.j@company.com',
 '789 Tech Road', 'Bangalore', 'Karnataka', '560001',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'IT' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'Senior Software Engineer' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Branch Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
 '2021-03-20', 'ACTIVE', 1),

('EMP004', 'Sarah', 'Elizabeth', 'Williams', 'FEMALE', '1995-03-25', '9876543213', 'sarah.w@company.com',
 '321 Finance Lane', 'Delhi', 'Delhi', '110003',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'Finance' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'Accountant' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
 '2023-05-10', 'ACTIVE', 1),

('EMP005', 'David', 'Robert', 'Brown', 'MALE', '1991-07-08', '9876543214', 'david.brown@company.com',
 '654 Sales Street', 'Bangalore', 'Karnataka', '560002',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'Sales Executive' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Branch Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Flexible' LIMIT 1),
 '2022-11-15', 'ACTIVE', 1),

('EMP006', 'Emily', NULL, 'Davis', 'FEMALE', '1993-09-30', '9876543215', 'emily.davis@company.com',
 '987 Developer Avenue', 'Delhi', 'Delhi', '110004',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'IT' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'Software Engineer' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
 '2023-08-01', 'ACTIVE', 1),

('EMP007', 'Robert', 'James', 'Miller', 'MALE', '1989-11-12', '9876543216', 'robert.m@company.com',
 '147 Operations Road', 'Bangalore', 'Karnataka', '560003',
 (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'Accountant' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Branch Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Night Shift' LIMIT 1),
 '2021-09-05', 'ACTIVE', 1),

('EMP008', 'Lisa', 'Ann', 'Wilson', 'FEMALE', '1994-04-18', '9876543217', 'lisa.wilson@company.com',
 '258 HR Boulevard', 'Delhi', 'Delhi', '110005',
 (SELECT id FROM manpower_types WHERE name = 'Part Time' LIMIT 1),
 (SELECT id FROM departments WHERE name = 'HR' LIMIT 1),
 (SELECT id FROM designations WHERE name = 'HR Manager' LIMIT 1),
 (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
 (SELECT id FROM shifts WHERE name = 'Flexible' LIMIT 1),
 '2023-02-20', 'ACTIVE', 1);

SELECT 'Dummy employees inserted successfully!' AS message;
SELECT COUNT(*) AS total_employees FROM employees;
*/

-- ============================================================================

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04 10:43:13

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `offer_letters`
--

DROP TABLE IF EXISTS `offer_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_letters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidate_name` varchar(255) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `generated_date` date NOT NULL,
  `joining_date` date NOT NULL,
  `status` enum('Draft','Sent','Accepted') DEFAULT 'Draft',
  `monthly_ctc` decimal(15,2) NOT NULL,
  `yearly_ctc` decimal(15,2) NOT NULL,
  `offer_data` json DEFAULT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- ============================================================================
-- SEED DATA - Master and Mock Data
-- ============================================================================

-- Banks
INSERT IGNORE INTO banks (name, ifsc_code, branch_name, address, city, state, is_active) VALUES
('State Bank of India', 'SBIN0001234', 'Noida Sector 18 Branch', 'Sector 18, Atta Market', 'Noida', 'Uttar Pradesh', 1),
('HDFC Bank', 'HDFC0001234', 'Connaught Place Branch', 'Connaught Place, Block A', 'New Delhi', 'Delhi', 1),
('ICICI Bank', 'ICIC0001234', 'MG Road Bangalore Branch', 'MG Road, Koramangala', 'Bangalore', 'Karnataka', 1),
('Axis Bank', 'UTIB0001234', 'Andheri Mumbai Branch', 'Andheri East, MIDC', 'Mumbai', 'Maharashtra', 1),
('Kotak Mahindra Bank', 'KKBK0001234', 'Hinjewadi Pune Branch', 'Hinjewadi Phase 1, IT Park', 'Pune', 'Maharashtra', 1),
('Punjab National Bank', 'PUNB0012340', 'Dwarka Delhi Branch', 'Sector 10, Dwarka', 'New Delhi', 'Delhi', 1),
('Bank of Baroda', 'BARB0VIJAYA', 'Indiranagar Bangalore', 'Indiranagar 100 Feet Road', 'Bangalore', 'Karnataka', 1),
('Canara Bank', 'CNRB0001234', 'Bandra Mumbai Branch', 'Bandra West, Linking Road', 'Mumbai', 'Maharashtra', 1),
('Union Bank of India', 'UBIN0801234', 'Gachibowli Hyderabad', 'HITEC City, Gachibowli', 'Hyderabad', 'Telangana', 1),
('IDFC First Bank', 'IDFB0021234', 'Whitefield Bangalore', 'Whitefield Main Road', 'Bangalore', 'Karnataka', 1),
('Yes Bank', 'YESB0001234', 'Powai Mumbai Branch', 'Powai, Hiranandani', 'Mumbai', 'Maharashtra', 1),
('IndusInd Bank', 'INDB0001234', 'Sector 62 Noida', 'Sector 62, Electronic City', 'Noida', 'Uttar Pradesh', 1);

-- Payment Modes
INSERT IGNORE INTO payment_modes (name, description, is_active) VALUES
('Bank Transfer (NEFT)', 'National Electronic Funds Transfer - Direct bank transfer', 1),
('Bank Transfer (RTGS)', 'Real Time Gross Settlement - Instant bank transfer for large amounts', 1),
('Bank Transfer (IMPS)', 'Immediate Payment Service - Instant 24x7 bank transfer', 1),
('Cheque', 'Payment by cheque', 1),
('Cash', 'Cash payment (for petty expenses)', 1),
('UPI', 'Unified Payments Interface - Digital payment', 1),
('Demand Draft', 'Bank demand draft', 1),
('Wire Transfer', 'International wire transfer', 1);

-- Qualifications
INSERT IGNORE INTO qualifications (name, code, description, level, is_active) VALUES
('10th Standard (SSC)', 'SSC', 'Secondary School Certificate', 'SCHOOL', 1),
('12th Standard (HSC)', 'HSC', 'Higher Secondary Certificate', 'SCHOOL', 1),
('Diploma in Engineering', 'DIPE', 'Diploma in Engineering (Polytechnic)', 'DIPLOMA', 1),
('Diploma in Computer Applications', 'DCA', 'Diploma in Computer Applications', 'DIPLOMA', 1),
('Diploma in Business Management', 'DBM', 'Diploma in Business Management', 'DIPLOMA', 1),
('Bachelor of Technology (B.Tech)', 'BTECH', 'Bachelor of Technology in Engineering', 'UNDERGRADUATE', 1),
('Bachelor of Engineering (B.E.)', 'BE', 'Bachelor of Engineering', 'UNDERGRADUATE', 1),
('Bachelor of Computer Applications (BCA)', 'BCA', 'Bachelor of Computer Applications', 'UNDERGRADUATE', 1),
('Bachelor of Science (B.Sc)', 'BSC', 'Bachelor of Science', 'UNDERGRADUATE', 1),
('Bachelor of Commerce (B.Com)', 'BCOM', 'Bachelor of Commerce', 'UNDERGRADUATE', 1),
('Bachelor of Arts (B.A.)', 'BA', 'Bachelor of Arts', 'UNDERGRADUATE', 1),
('Bachelor of Business Administration (BBA)', 'BBA', 'Bachelor of Business Administration', 'UNDERGRADUATE', 1),
('Master of Technology (M.Tech)', 'MTECH', 'Master of Technology', 'POSTGRADUATE', 1),
('Master of Engineering (M.E.)', 'ME', 'Master of Engineering', 'POSTGRADUATE', 1),
('Master of Computer Applications (MCA)', 'MCA', 'Master of Computer Applications', 'POSTGRADUATE', 1),
('Master of Science (M.Sc)', 'MSC', 'Master of Science', 'POSTGRADUATE', 1),
('Master of Commerce (M.Com)', 'MCOM', 'Master of Commerce', 'POSTGRADUATE', 1),
('Master of Arts (M.A.)', 'MA', 'Master of Arts', 'POSTGRADUATE', 1),
('Master of Business Administration (MBA)', 'MBA', 'Master of Business Administration', 'POSTGRADUATE', 1),
('Doctor of Philosophy (Ph.D.)', 'PHD', 'Doctorate in Philosophy', 'DOCTORATE', 1),
('Chartered Accountant (CA)', 'CA', 'Chartered Accountant', 'PROFESSIONAL', 1),
('Company Secretary (CS)', 'CS', 'Company Secretary', 'PROFESSIONAL', 1),
('Cost and Management Accountant (CMA)', 'CMA', 'Cost and Management Accountant', 'PROFESSIONAL', 1),
('Certified Public Accountant (CPA)', 'CPA', 'Certified Public Accountant', 'PROFESSIONAL', 1),
('Project Management Professional (PMP)', 'PMP', 'Project Management Professional Certification', 'PROFESSIONAL', 1),
('Certified Information Systems Auditor (CISA)', 'CISA', 'CISA Certification', 'PROFESSIONAL', 1),
('AWS Certified Solutions Architect', 'AWS-CSA', 'Amazon Web Services Certification', 'PROFESSIONAL', 1),
('Google Cloud Professional', 'GCP-PRO', 'Google Cloud Platform Certification', 'PROFESSIONAL', 1),
('Microsoft Certified Azure', 'MS-AZURE', 'Microsoft Azure Certification', 'PROFESSIONAL', 1);

-- Document Types
INSERT IGNORE INTO document_types (name, code, description, is_mandatory, allowed_extensions, max_file_size_mb, is_active) VALUES
('Aadhar Card', 'AADHAR', 'Aadhar Card - Government ID proof', 1, 'pdf,jpg,jpeg,png', 5, 1),
('PAN Card', 'PAN', 'Permanent Account Number Card', 1, 'pdf,jpg,jpeg,png', 5, 1),
('Passport', 'PASSPORT', 'Passport - International ID', 0, 'pdf,jpg,jpeg,png', 10, 1),
('Voter ID', 'VOTERID', 'Voter Identity Card', 0, 'pdf,jpg,jpeg,png', 5, 1),
('Driving License', 'DL', 'Driving License', 0, 'pdf,jpg,jpeg,png', 5, 1),
('10th Marksheet', '10TH', '10th Standard Marksheet/Certificate', 1, 'pdf,jpg,jpeg,png', 5, 1),
('12th Marksheet', '12TH', '12th Standard Marksheet/Certificate', 1, 'pdf,jpg,jpeg,png', 5, 1),
('Graduation Certificate', 'GRAD', 'Graduation Degree Certificate', 1, 'pdf,jpg,jpeg,png', 10, 1),
('Post Graduation Certificate', 'PG', 'Post Graduation Degree Certificate', 0, 'pdf,jpg,jpeg,png', 10, 1),
('Professional Certificate', 'PROF', 'Professional Certification Documents', 0, 'pdf,jpg,jpeg,png', 10, 1),
('Resume/CV', 'RESUME', 'Current Resume or Curriculum Vitae', 1, 'pdf,doc,docx', 5, 1),
('Experience Letter', 'EXP', 'Previous Employment Experience Letter', 0, 'pdf,jpg,jpeg,png', 5, 1),
('Relieving Letter', 'RELIEVE', 'Relieving Letter from Previous Employer', 0, 'pdf,jpg,jpeg,png', 5, 1),
('Salary Slip', 'SALARY', 'Previous Salary Slips (Last 3 months)', 0, 'pdf,jpg,jpeg,png', 5, 1),
('Offer Letter', 'OFFER', 'Current Company Offer Letter', 1, 'pdf', 5, 1),
('Appointment Letter', 'APPOINT', 'Appointment Letter', 0, 'pdf', 5, 1),
('Bank Passbook', 'BANK', 'Bank Account Passbook/Statement', 1, 'pdf,jpg,jpeg,png', 5, 1),
('Cancelled Cheque', 'CHEQUE', 'Cancelled Cheque for Salary Account', 1, 'pdf,jpg,jpeg,png', 5, 1),
('Photograph', 'PHOTO', 'Passport Size Photograph', 1, 'jpg,jpeg,png', 2, 1),
('Address Proof', 'ADDRESS', 'Address Proof Document', 1, 'pdf,jpg,jpeg,png', 5, 1),
('Medical Certificate', 'MEDICAL', 'Medical Fitness Certificate', 0, 'pdf,jpg,jpeg,png', 5, 1),
('Police Verification', 'POLICE', 'Police Verification Certificate', 0, 'pdf,jpg,jpeg,png', 5, 1),
('Background Verification', 'BGV', 'Background Verification Report', 0, 'pdf', 10, 1);

-- Customers
INSERT IGNORE INTO customers (name, code, description, is_active) VALUES
('Customer A', 'CUST001', 'First customer', 1),
('Customer B', 'CUST002', 'Second customer', 1),
('Customer C', 'CUST003', 'Third customer', 1);

-- Projects
INSERT IGNORE INTO projects (name, code, description, is_active) VALUES
('Project Alpha', 'PROJ001', 'Alpha project', 1),
('Project Beta', 'PROJ002', 'Beta project', 1),
('Project Gamma', 'PROJ003', 'Gamma project', 1);

-- Mock Data (Employees, Users, Attendance, etc.)
-- Disable foreign key checks temporarily for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

INSERT IGNORE INTO employees (
  employee_id, first_name, middle_name, last_name, gender, date_of_birth,
  mobile, email, work_email, address, city, state, pincode,
  manpower_type_id, department_id, designation_id, work_location_id,
  shift_id, joining_date, status, is_active
) VALUES
('EMP001', 'John', NULL, 'Doe', 'MALE', '1990-05-15', '9876543210', 'john.doe@company.com', 'john.doe@work.company.com', '123 Main Street', 'Delhi', 'Delhi', '110001',
  (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1),
  (SELECT id FROM designations WHERE name = 'Software Engineer' LIMIT 1),
  (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
  (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
  '2023-01-15', 'ACTIVE', 1),
('EMP002', 'Jane', 'Marie', 'Smith', 'FEMALE', '1992-08-20', '9876543211', 'jane.smith@company.com', 'jane.smith@work.company.com', '456 Park Avenue', 'Delhi', 'Delhi', '110002',
  (SELECT id FROM manpower_types WHERE name = 'Full Time' LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
  (SELECT id FROM designations WHERE name = 'HR Manager' LIMIT 1),
  (SELECT id FROM work_locations WHERE name = 'Head Office' LIMIT 1),
  (SELECT id FROM shifts WHERE name = 'Morning Shift' LIMIT 1),
  '2022-06-01', 'ACTIVE', 1);

INSERT IGNORE INTO users (username, full_name, role, password_hash, employee_id, department_id) VALUES
('john.doe', 'John Doe', 'employee', '$2b$10$5vNr6BsxpHYApQSWWt2IGO0kc1kdrnFF8nUa4OdTWFBw6PQ6z1f4G', 1, 1),
('jane.smith', 'Jane Marie Smith', 'manager', '$2b$10$5vNr6BsxpHYApQSWWt2IGO0kc1kdrnFF8nUa4OdTWFBw6PQ6z1f4G', 2, 2);

SET FOREIGN_KEY_CHECKS = 1;

-- Seed Data Insertion Complete

-- ==================== NEW MODULES MIGRATION ====================

-- ==================== AWARDS TABLE ====================
CREATE TABLE IF NOT EXISTS `awards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `award_name` varchar(255) NOT NULL,
  `award_type` enum('RECOGNITION','ACHIEVEMENT','SERVICE','PERFORMANCE','INNOVATION','LEADERSHIP','TEAMWORK','OTHER') NOT NULL DEFAULT 'RECOGNITION',
  `category` enum('PERFORMANCE','ATTENDANCE','INNOVATION','LEADERSHIP','TEAMWORK','SERVICE_YEARS','CUSTOMER_SATISFACTION','OTHER') DEFAULT 'PERFORMANCE',
  `description` text,
  `award_date` date NOT NULL,
  `given_by` varchar(255) DEFAULT NULL,
  `certificate_number` varchar(100) DEFAULT NULL,
  `remarks` text,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `awards_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================== CERTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS `certifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `certification_name` varchar(255) NOT NULL,
  `issuing_organization` varchar(255) NOT NULL,
  `certification_number` varchar(100) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `skill_area` varchar(255) DEFAULT NULL,
  `description` text,
  `is_mandatory` tinyint(1) DEFAULT '0',
  `status` enum('ACTIVE','EXPIRED','REVOKED') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `certifications_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================== ESI RECORDS TABLE ====================
CREATE TABLE IF NOT EXISTS `esi_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `esi_number` varchar(100) DEFAULT NULL,
  `month` tinyint NOT NULL COMMENT '1-12',
  `year` int NOT NULL,
  `gross_wages` decimal(12,2) NOT NULL DEFAULT '0.00',
  `esi_employee_contribution` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '0.75% of gross',
  `esi_employer_contribution` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '3.25% of gross',
  `total_contribution` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_date` date DEFAULT NULL,
  `remarks` text,
  `status` enum('PENDING','PAID','OVERDUE') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_month_year` (`employee_id`,`month`,`year`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `esi_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================== PF RECORDS TABLE ====================
CREATE TABLE IF NOT EXISTS `pf_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `uan_number` varchar(100) DEFAULT NULL COMMENT 'Universal Account Number',
  `pf_account_number` varchar(100) DEFAULT NULL,
  `month` tinyint NOT NULL COMMENT '1-12',
  `year` int NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL DEFAULT '0.00',
  `pf_employee_contribution` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '12% of basic',
  `pf_employer_contribution` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '12% of basic',
  `eps_contribution` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '8.33% up to 15000',
  `total_contribution` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_date` date DEFAULT NULL,
  `remarks` text,
  `status` enum('PENDING','PAID','OVERDUE') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_month_year` (`employee_id`,`month`,`year`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `pf_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================== ID CARDS TABLE ====================
CREATE TABLE IF NOT EXISTS `id_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `card_number` varchar(100) NOT NULL,
  `card_type` enum('ID_CARD','ACCESS_CARD','VISITOR_CARD') DEFAULT 'ID_CARD',
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `emergency_contact` varchar(255) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `address` text,
  `qr_code_data` text,
  `barcode_data` text,
  `remarks` text,
  `status` enum('ACTIVE','EXPIRED','LOST','DEACTIVATED') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `card_number` (`card_number`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `id_cards_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================== VISITING CARDS TABLE ====================
CREATE TABLE IF NOT EXISTS `visiting_cards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `display_designation` varchar(255) DEFAULT NULL,
  `display_department` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `company_logo` varchar(500) DEFAULT NULL,
  `mobile_on_card` varchar(20) DEFAULT NULL,
  `email_on_card` varchar(255) DEFAULT NULL,
  `office_phone` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `address_on_card` text,
  `quantity_requested` int DEFAULT '100',
  `quantity_printed` int DEFAULT '0',
  `card_template` enum('STANDARD','PREMIUM','EXECUTIVE','DIGITAL') DEFAULT 'STANDARD',
  `remarks` text,
  `status` enum('REQUESTED','DESIGN_PENDING','APPROVED','PRINTING','DISPATCHED','DELIVERED','CANCELLED') DEFAULT 'REQUESTED',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `visiting_cards_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
