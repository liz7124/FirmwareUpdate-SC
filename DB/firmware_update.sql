-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 26, 2020 at 12:04 PM
-- Server version: 10.4.11-MariaDB
-- PHP Version: 7.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `firmware_update`
--

-- --------------------------------------------------------

--
-- Table structure for table `device_data`
--

CREATE TABLE `device_data` (
  `device_id` int(11) NOT NULL,
  `manufacturer_id` int(11) NOT NULL,
  `firmware_version` int(11) NOT NULL,
  `device_type` varchar(255) NOT NULL,
  `URI` varchar(255) NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `firmware_update_metadata`
--

CREATE TABLE `firmware_update_metadata` (
  `metadata_id` int(11) NOT NULL,
  `manufacturer_id` int(11) NOT NULL,
  `firmware_version` int(11) NOT NULL,
  `device_type` varchar(255) NOT NULL,
  `release_date` varchar(255) NOT NULL,
  `url` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `firmware_update_transactions`
--

CREATE TABLE `firmware_update_transactions` (
  `transactions_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `manufacturer_id` int(11) NOT NULL,
  `metadata_id` int(11) NOT NULL,
  `old_firmware_version` int(11) NOT NULL,
  `new_firmware_version` int(11) NOT NULL,
  `update_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `manufacturer`
--

CREATE TABLE `manufacturer` (
  `manufacturer_id` int(11) NOT NULL,
  `manufacturer_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `device_data`
--
ALTER TABLE `device_data`
  ADD PRIMARY KEY (`device_id`);

--
-- Indexes for table `firmware_update_metadata`
--
ALTER TABLE `firmware_update_metadata`
  ADD PRIMARY KEY (`metadata_id`);

--
-- Indexes for table `firmware_update_transactions`
--
ALTER TABLE `firmware_update_transactions`
  ADD PRIMARY KEY (`transactions_id`);

--
-- Indexes for table `manufacturer`
--
ALTER TABLE `manufacturer`
  ADD PRIMARY KEY (`manufacturer_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `device_data`
--
ALTER TABLE `device_data`
  MODIFY `device_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `firmware_update_metadata`
--
ALTER TABLE `firmware_update_metadata`
  MODIFY `metadata_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `firmware_update_transactions`
--
ALTER TABLE `firmware_update_transactions`
  MODIFY `transactions_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `manufacturer`
--
ALTER TABLE `manufacturer`
  MODIFY `manufacturer_id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
