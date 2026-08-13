-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 26, 2026 at 12:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dormhub_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `login_time` datetime DEFAULT NULL,
  `logout_time` datetime DEFAULT NULL,
  `status` enum('present','late','absent') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `demerits`
--

CREATE TABLE `demerits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `violation` varchar(255) DEFAULT NULL,
  `points` int(11) DEFAULT 1,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `demerits`
--

INSERT INTO `demerits` (`id`, `user_id`, `violation`, `points`, `remarks`, `created_at`) VALUES
(1, 15, 'adasds', 1, NULL, '2026-05-13 08:14:27'),
(2, 15, 'fsdfdfdsff', 4, NULL, '2026-05-13 08:20:15'),
(3, 22, 'ghjgjghj', 10, NULL, '2026-05-14 07:18:00'),
(5, 24, 'xcx', 1, NULL, '2026-05-14 07:37:07'),
(7, 18, 'vcxvcxvcx', 3, NULL, '2026-05-20 10:34:43'),
(8, 26, 'xvc', 1, NULL, '2026-05-20 11:04:48');

-- --------------------------------------------------------

--
-- Table structure for table `face_descriptors`
--

CREATE TABLE `face_descriptors` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `descriptor` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gate_requests`
--

CREATE TABLE `gate_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `request_type` enum('in','out') NOT NULL,
  `location_lat` decimal(10,8) DEFAULT NULL,
  `location_lng` decimal(11,8) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `fingerprint_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gate_requests`
--

INSERT INTO `gate_requests` (`id`, `user_id`, `request_type`, `location_lat`, `location_lng`, `status`, `approved_by`, `remarks`, `fingerprint_verified`, `created_at`, `updated_at`) VALUES
(1, 23, 'out', 12.28126400, 123.35757400, 'approved', 1, 'Paghimat', 1, '2026-05-14 05:07:53', '2026-05-14 05:10:41'),
(2, 23, 'in', 12.28126400, 123.35757400, 'rejected', 1, 'Bawal mag sulod', 1, '2026-05-14 05:11:42', '2026-05-14 05:12:06'),
(3, 23, 'out', 12.28125406, 123.35754275, 'approved', 1, NULL, 1, '2026-05-14 06:22:22', '2026-05-14 06:25:45'),
(4, 23, 'out', 12.28126900, 123.35757400, 'pending', NULL, NULL, 1, '2026-05-14 06:26:42', '2026-05-14 06:26:42'),
(5, 16, 'out', 12.28125613, 123.35754080, 'pending', NULL, NULL, 1, '2026-05-14 07:30:42', '2026-05-14 07:30:42'),
(6, 16, 'in', 12.28080189, 123.35749811, 'approved', 1, 'Sulod na', 1, '2026-05-20 10:38:40', '2026-05-20 10:40:04');

-- --------------------------------------------------------

--
-- Table structure for table `nightly_attendance`
--

CREATE TABLE `nightly_attendance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('pending','checked_in') DEFAULT 'pending',
  `checked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nightly_attendance`
--

INSERT INTO `nightly_attendance` (`id`, `user_id`, `date`, `status`, `checked_at`, `created_at`) VALUES
(1, 23, '2026-05-14', 'checked_in', '2026-05-14 07:13:13', '2026-05-14 07:13:13'),
(2, 15, '2026-05-14', 'checked_in', '2026-05-14 07:23:43', '2026-05-14 07:23:43');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `student_id` varchar(50) DEFAULT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('superadmin','staff','student') DEFAULT 'student',
  `program` varchar(100) DEFAULT NULL,
  `year_section` varchar(100) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `fingerprint_id` varchar(100) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `fingerprint_registered` tinyint(1) DEFAULT 0,
  `address` text DEFAULT NULL,
  `parent_name` varchar(255) DEFAULT NULL,
  `parent_contact` varchar(100) DEFAULT NULL,
  `parent_address` text DEFAULT NULL,
  `registration_status` varchar(20) DEFAULT NULL,
  `registration_remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `student_id`, `fullname`, `email`, `password`, `role`, `program`, `year_section`, `room_number`, `fingerprint_id`, `profile_picture`, `status`, `created_at`, `fingerprint_registered`, `address`, `parent_name`, `parent_contact`, `parent_address`, `registration_status`, `registration_remarks`) VALUES
(1, 'SUPER-ADMIN-001', 'Landlady ', 'superadmin@dormhub.com', '$2b$10$gpnkbl3sHNeeKrn461AS8uwY24WKIpi7eXxzGkIvck4aNlcllXxsa', 'superadmin', NULL, NULL, NULL, NULL, NULL, 'active', '2026-05-07 05:26:37', 0, NULL, NULL, NULL, NULL, NULL, NULL),
(8, '21-1-2287', 'Remuel john Almodal', 'almodalremueljohn@gmail.com', '$2b$10$9FMTGhVL0fBih5bKqxFcQ.RBot4gvJsYnsyErvXeovSsLNo8U1l9G', 'student', 'BSHM', '2nd Year', NULL, NULL, NULL, 'active', '2026-05-13 07:53:33', 0, 'Jamorawon', 'Jjhhj', '09817272189', 'Jjjjkmmm', 'pending', NULL),
(13, '21-1-2281', 'Remuel john Almodal', 'almodalr1emueljohn@gmail.com', '$2b$10$9FK6AKn..RWWsctSVsxRn.Fz9onGmL7EaJBU2h/2wguIY8fyBwF52', 'student', 'BSHM', '2nd Year', NULL, NULL, NULL, 'active', '2026-05-13 07:55:47', 0, 'Jamorawon', 'Jjhhj', '09817272189', 'Jjjjkmmm', 'pending', NULL),
(15, '21-1-2272', 'Remuel john Almodal', 't@gmail.com', '$2b$10$lEyorLue.tzXsMRnbwWQT.dTasCSJ2dilScKWE4nKmuWNoRSJUAuy', 'student', 'BSHM', '3rd Year', NULL, NULL, NULL, 'active', '2026-05-13 08:07:28', 0, 'Nznsnsnnsn', 'Nsnkssk', 'Kdnsn', 'Mzsnm', 'approved', NULL),
(16, '21-1-2211', 'Ndnks', 'd@gmail.com', '$2b$10$oghPlHPahtrmbhrloVoJzeG8/u403V/P9if0OrppyAonVjvAaStHC', 'student', 'BSED', '2nd Year', NULL, NULL, NULL, 'active', '2026-05-13 10:00:37', 1, 'Nsnsnsn', 'Ndnsk', '09817272189', 'Nsnsns', 'approved', NULL),
(17, '23-1-0747', 'Ezhay Estrella ', 'ezhaymei.barrugaestrella@gmail.com', '$2b$10$vbUnJ/6rVn2aBdLJP8lGPu3uSQWeVXOvcoZ21qm0A4rdGGZVMgmiy', 'student', 'BSCS', '3rd Year', NULL, NULL, NULL, 'active', '2026-05-13 10:18:43', 0, 'Poblacion Mandaon Masbate ', 'Ave Estrella ', '09636567877', 'Poblacion Mandaon Masbate ', 'approved', NULL),
(18, '21-1-22111', 'Nnj', 'm@gmail.com', '$2b$10$cSpQbcVpdi2699PTy.0CS.60eFQUFOXOxuy8tlfLx6mxkIQwA0q3W', 'student', 'BSBA', '4th Year', NULL, NULL, NULL, 'active', '2026-05-13 10:51:01', 0, 'Nnjjn', 'Mmmm', '09817272189', 'Nnnn', 'pending', NULL),
(20, '21-1-2289', 'Remuel john Almodal', 'l@g.com', '$2b$10$CIcNiwD2c56vOny68/42au0V9TiVxyb2gq4pJWxclmlQiKypP0gP.', 'student', 'BSHM', '4th Year', NULL, NULL, NULL, 'active', '2026-05-14 03:51:25', 0, 'Nzndkdk', 'Mmmm', '09817272189', 'Kkskd', 'pending', NULL),
(21, '21-1-228', 'B', 'j@gm.com', '$2b$10$4jk0PJpw0Esf7PbpbJLG1ekzQycetFyC2FunxTLMnTsPtK9sYaZFu', 'student', 'BSBA', '4th Year', NULL, NULL, NULL, 'active', '2026-05-14 03:58:05', 0, 'Kkkn', 'M', '09817272189', 'K', 'pending', NULL),
(22, '22-1-2287', 'Nnj', 'hh@gmail.com', '$2b$10$yN/bDdHE5qOuIkr5OP983eKviGz9h.IC0YgL1CyjUanyOgGnPQ3Wa', 'student', 'BSHM', '4th Year', NULL, NULL, NULL, 'active', '2026-05-14 04:02:53', 0, 'Kfll', 'L', '09817272189', 'Klm', 'pending', NULL),
(23, '123452', 'dffdsfd', 'tst@gmail.com', '$2b$10$Qu6eDL0tIjBIVvVfazp4GOlbfRbJPNXSXrtDG2bLxdAZqxBJhQdHu', 'student', 'BSCS', '2nd Year', NULL, NULL, NULL, 'active', '2026-05-14 04:33:57', 1, 'dfsfdsf', 'dsfsdf', '09461234561', 'dsfsdfds', 'approved', NULL),
(24, '123456788', 'dsfsdfsd', 'admin@example.com', '$2b$10$4xJ8udTBc1g7vSgRU2EPceOqeC4D1dHzfJn.cdcjZHitIS2fCSLiG', 'student', 'BSHM', '2nd Year', '2', NULL, NULL, 'active', '2026-05-14 07:32:02', 1, 'vccvbvb', 'dsfsdf', '09461234561', 'czxcxzczxcxz', 'approved', NULL),
(25, '23-1-367', 'Alaiza arguiiles', 'alaizaarguilles4@gmail.com', '$2b$10$pf96McKWrDtMG.7hmBlqbu5vFfbZu6URMG7IxpbUnWI8mndPu5lVm', 'student', 'BSIT', '3rd Year', '09', NULL, NULL, 'active', '2026-05-20 10:49:27', 0, 'cahamapo,maoapm', 'mamao', '09897652416', 'vsgaksnw', 'approved', 'zvxvxcv'),
(26, '23-1-300', 'mamamo', 'estrellzaimei@gmail.com', '$2b$10$0lkgH7HYedEZRRUgVmpZbu6s8kXOwKqv3NvN5t8bYGS0wV0wsw/La', 'student', 'BSCS', '3rd Year', '04', NULL, NULL, 'active', '2026-05-20 10:57:36', 1, 'hhhh', 'si papa ko ', '09897652416', 'jjjj', 'approved', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `webauthn_credentials`
--

CREATE TABLE `webauthn_credentials` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `credential_id` text NOT NULL,
  `public_key` text DEFAULT NULL,
  `counter` int(11) DEFAULT 0,
  `transports` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `webauthn_credentials`
--

INSERT INTO `webauthn_credentials` (`id`, `user_id`, `credential_id`, `public_key`, `counter`, `transports`, `created_at`) VALUES
(1, 23, 'v8_Eort3wecNPxZ23YeWuA', 'pQECAyYgASFYIKqUF3C9O7gjLW76dtGVxDP5+hHYsCe3EaBv1w+zBPXMIlggTIPYtj0qmqZNxP+ncIp3nRZ7ktde5ua/SCstSSwOpio=', 0, '[\"hybrid\",\"internal\"]', '2026-05-14 05:03:19'),
(2, 16, '8YK1JceTIS1xEt-B1VSrqw', 'pQECAyYgASFYIPyk0rmvR4IHpzggg3gTvEYlMFIHb15Ynoya1fyAiqG+IlggqBw+p/6rr5QUg/j2epSC9wagdnGH+sLo2e0RVfuw0aM=', 0, '[\"hybrid\",\"internal\"]', '2026-05-14 07:30:13'),
(3, 24, 'T25anRbvzpxfrbjhOvTxuA', 'pQECAyYgASFYIKmxbIa4iyGK0pgoXaqF5RqT1QRqthvpskmM3pMGn3q0IlggBWKLUhkGAljwfgpwarf7Ip3UTjjxu45qWW7JeXiiJnM=', 0, '[\"hybrid\",\"internal\"]', '2026-05-14 07:35:09'),
(4, 26, 'eoIO1TzoagdUXbRBFhoUSQ', 'pQECAyYgASFYIIUJqpZObDVZkxpdrYU7+EijSqbBG144Rq3p2hLOp/f7IlggnL69DkoRs2ZDSktFyBAVLUz7BZc17vXEx4MOF/COrLA=', 0, '[\"hybrid\",\"internal\"]', '2026-05-20 10:59:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `demerits`
--
ALTER TABLE `demerits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `face_descriptors`
--
ALTER TABLE `face_descriptors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `gate_requests`
--
ALTER TABLE `gate_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `nightly_attendance`
--
ALTER TABLE `nightly_attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nightly` (`user_id`,`date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `webauthn_credentials`
--
ALTER TABLE `webauthn_credentials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `demerits`
--
ALTER TABLE `demerits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `face_descriptors`
--
ALTER TABLE `face_descriptors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gate_requests`
--
ALTER TABLE `gate_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `nightly_attendance`
--
ALTER TABLE `nightly_attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `webauthn_credentials`
--
ALTER TABLE `webauthn_credentials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `demerits`
--
ALTER TABLE `demerits`
  ADD CONSTRAINT `demerits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `face_descriptors`
--
ALTER TABLE `face_descriptors`
  ADD CONSTRAINT `face_descriptors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `gate_requests`
--
ALTER TABLE `gate_requests`
  ADD CONSTRAINT `gate_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `gate_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `nightly_attendance`
--
ALTER TABLE `nightly_attendance`
  ADD CONSTRAINT `nightly_attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `webauthn_credentials`
--
ALTER TABLE `webauthn_credentials`
  ADD CONSTRAINT `webauthn_credentials_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
