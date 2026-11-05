import { AppDatabase, Reward } from "../types";

export const LEGACY_GAMES: string[] = [
  "Going Medieval",
  "diplomacie inao",
  "tcg",
  "Bellwright",
  "gta V",
  "Stranded alien dawn",
  "BDG 3",
  "ManorL",
  "fc",
  "med dyn",
  "sengoku",
  "stacklands",
  "anno",
  "age of",
  "valhalla",
  "x",
  "PARKinect"
];

// Dictionnaire compact des logs historiques non nuls fournis par l'utilisateur
export const LEGACY_LOGS: Record<string, Record<string, string>> = {
  "25/03/2022": { "ManorL": "3:00" },
  "26/03/2022": { "ManorL": "1:46" },
  "01/04/2022": { "ManorL": "2:38" },
  "03/04/2022": { "ManorL": "2:52" },
  "06/04/2022": { "ManorL": "2:20" },
  "07/04/2022": { "ManorL": "2:25" },
  "09/04/2022": { "ManorL": "1:50" },
  "10/04/2022": { "ManorL": "0:42" },
  "13/04/2022": { "ManorL": "2:38" },
  "21/04/2022": { "ManorL": "1:40" },
  "05/05/2022": { "ManorL": "1:40" },
  "06/05/2022": { "ManorL": "1:15" },
  "07/05/2022": { "ManorL": "01:04" },
  "08/05/2022": { "ManorL": "1:38" },
  "09/05/2022": { "ManorL": "00:35" },
  "12/05/2022": { "ManorL": "2:13" },
  "14/05/2022": { "ManorL": "2:24" },
  "18/05/2022": { "ManorL": "1:36" },
  "19/05/2022": { "ManorL": "2:53" },
  "20/05/2022": { "ManorL": "2:34" },
  "21/05/2022": { "ManorL": "2:45" },
  "03/06/2022": { "ManorL": "2:20" },
  "04/06/2022": { "ManorL": "2:20" },
  "08/06/2022": { "ManorL": "1:58" },
  "09/06/2022": { "ManorL": "2:35" },
  "10/06/2022": { "ManorL": "1:33" },
  "15/06/2022": { "ManorL": "4:52" },
  "16/06/2022": { "ManorL": "2:11" },
  "17/06/2022": { "ManorL": "1:36" },
  "30/06/2022": { "ManorL": "3:35" },
  "02/07/2022": { "ManorL": "4:30" },
  "03/07/2022": { "ManorL": "2:30" },
  "05/07/2022": { "ManorL": "3:20" },
  "06/07/2022": { "ManorL": "4:10" },
  "07/07/2022": { "ManorL": "3:45" },
  "08/07/2022": { "ManorL": "4:40" },
  "09/07/2022": { "ManorL": "2:00" },
  "10/07/2022": { "ManorL": "4:26" },
  "11/07/2022": { "ManorL": "4:05" },
  "11/08/2022": { "ManorL": "2:15" },
  "12/08/2022": { "ManorL": "3:35" },
  "13/08/2022": { "ManorL": "03:08" },
  "14/08/2022": { "ManorL": "4:45" },
  "15/08/2022": { "ManorL": "2:52" },
  "16/08/2022": { "fc": "07:20" },
  "17/08/2022": { "fc": "05:00", "sengoku": "01:00", "valhalla": "01:00" },
  "18/08/2022": { "stacklands": "02:48", "valhalla": "02:48" },
  "19/08/2022": { "fc": "06:30", "sengoku": "02:00", "valhalla": "02:00" },
  "20/08/2022": { "fc": "05:20" },
  "21/08/2022": { "fc": "08:00" },
  "22/08/2022": { "fc": "01:40" },
  "23/08/2022": { "fc": "07:30" },
  "31/08/2022": { "fc": "03:30" },
  "01/09/2022": { "fc": "03:20" },
  "09/09/2022": { "fc": "04:15" },
  "10/09/2022": { "fc": "03:10" },
  "11/09/2022": { "fc": "04:12" },
  "12/09/2022": { "fc": "02:40" },
  "13/09/2022": { "fc": "05:15" },
  "14/09/2022": { "fc": "05:20" },
  "15/09/2022": { "fc": "02:35" },
  "17/09/2022": { "fc": "02:40" },
  "18/09/2022": { "fc": "02:50" },
  "20/09/2022": { "fc": "01:50" },
  "21/09/2022": { "fc": "04:55" },
  "23/09/2022": { "fc": "06:00" },
  "24/09/2022": { "fc": "05:30" },
  "25/09/2022": { "anno": "03:50" },
  "27/09/2022": { "fc": "03:38" },
  "28/09/2022": { "fc": "02:00" },
  "29/09/2022": { "fc": "02:45" },
  "30/09/2022": { "fc": "02:15" },
  "01/10/2022": { "fc": "01:35" },
  "02/10/2022": { "fc": "02:50" },
  "04/10/2022": { "fc": "03:25" },
  "05/10/2022": { "fc": "01:40" },
  "06/10/2022": { "fc": "02:56" },
  "09/10/2022": { "fc": "03:32" },
  "10/10/2022": { "fc": "02:23" },
  "12/10/2022": { "fc": "03:12" },
  "13/10/2022": { "fc": "04:32" },
  "14/10/2022": { "fc": "03:50" },
  "15/10/2022": { "fc": "04:45" },
  "16/10/2022": { "fc": "03:00" },
  "19/10/2022": { "fc": "03:25" },
  "23/10/2022": { "fc": "02:50" },
  "01/11/2022": { "ManorL": "4:10" },
  "02/11/2022": { "ManorL": "7:50" },
  "03/11/2022": { "ManorL": "5:20" },
  "04/11/2022": { "ManorL": "5:45" },
  "05/11/2022": { "ManorL": "5:50" },
  "06/11/2022": { "ManorL": "3:30" },
  "07/11/2022": { "ManorL": "2:30" },
  "08/11/2022": { "ManorL": "2:30" },
  "09/11/2022": { "ManorL": "2:10" },
  "10/11/2022": { "ManorL": "3:44" },
  "11/11/2022": { "ManorL": "2:45" },
  "12/11/2022": { "ManorL": "7:41" },
  "13/11/2022": { "ManorL": "2:11" },
  "16/11/2022": { "ManorL": "2:10" },
  "17/11/2022": { "ManorL": "4:00" },
  "18/11/2022": { "ManorL": "2:00" },
  "20/11/2022": { "ManorL": "5:45" },
  "30/11/2022": { "ManorL": "3:00" },
  "01/12/2022": { "ManorL": "3:20" },
  "14/12/2022": { "ManorL": "2:20" },
  "15/12/2022": { "ManorL": "3:00" },
  "16/12/2022": { "ManorL": "4:05" },
  "17/12/2022": { "ManorL": "4:00" },
  "18/12/2022": { "ManorL": "1:40" },
  "19/12/2022": { "ManorL": "2:45" },
  "20/12/2022": { "ManorL": "3:44" },
  "22/12/2022": { "ManorL": "3:14" },
  "24/12/2022": { "ManorL": "0:45" },
  "25/12/2022": { "ManorL": "1:30" },
  "30/12/2022": { "age of": "02:50" },
  "01/01/2023": { "age of": "05:00" },
  "02/01/2023": { "age of": "04:10" },
  "03/01/2023": { "age of": "03:20" },
  "05/01/2023": { "age of": "04:00" },
  "06/01/2023": { "age of": "01:24" },
  "08/01/2023": { "age of": "04:35" },
  "09/01/2023": { "age of": "02:10" },
  "10/01/2023": { "age of": "04:30" },
  "15/01/2023": { "age of": "03:40" },
  "16/01/2023": { "age of": "01:30" },
  "18/01/2023": { "age of": "05:20" },
  "19/01/2023": { "age of": "02:30" },
  "20/01/2023": { "age of": "02:10" },
  "21/01/2023": { "age of": "03:30" },
  "24/01/2023": { "age of": "02:30" },
  "25/01/2023": { "age of": "01:50" },
  "18/02/2023": { "age of": "03:40" },
  "19/02/2023": { "age of": "01:35" },
  "22/02/2023": { "age of": "03:45" },
  "23/02/2023": { "age of": "00:55" },
  "24/02/2023": { "age of": "01:00" },
  "27/02/2023": { "age of": "02:00" },
  "28/02/2023": { "age of": "01:15" },
  "02/03/2023": { "age of": "02:00" },
  "13/03/2023": { "fc": "02:30" },
  "15/03/2023": { "fc": "04:30" },
  "20/03/2023": { "fc": "01:45" },
  "21/03/2023": { "fc": "03:45" },
  "22/03/2023": { "fc": "02:30" },
  "23/03/2023": { "fc": "04:30" },
  "26/03/2023": { "fc": "04:00" },
  "28/03/2023": { "fc": "01:37" },
  "30/03/2023": { "fc": "04:50" },
  "31/03/2023": { "fc": "02:40" },
  "02/04/2023": { "fc": "00:35" },
  "03/04/2023": { "fc": "04:25" },
  "04/04/2023": { "fc": "02:00" },
  "05/04/2023": { "fc": "03:45" },
  "07/04/2023": { "fc": "02:50" },
  "08/04/2023": { "fc": "03:20" },
  "09/04/2023": { "fc": "07:20" },
  "10/04/2023": { "fc": "05:30" },
  "11/04/2023": { "fc": "03:20" },
  "13/04/2023": { "fc": "01:20" },
  "14/04/2023": { "fc": "03:45" },
  "15/04/2023": { "fc": "00:45" },
  "16/04/2023": { "fc": "01:20" },
  "18/04/2023": { "fc": "02:15" },
  "19/04/2023": { "fc": "01:35" },
  "25/04/2023": { "fc": "03:13" },
  "26/04/2023": { "fc": "01:51" },
  "27/04/2023": { "fc": "00:49" },
  "28/04/2023": { "fc": "01:29" },
  "30/04/2023": { "fc": "01:35" },
  "12/05/2023": { "fc": "01:18" },
  "13/05/2023": { "fc": "00:15" },
  "15/05/2023": { "valhalla": "00:24" },
  "17/05/2023": { "valhalla": "03:00" },
  "18/05/2023": { "age of": "04:45" },
  "19/05/2023": { "age of": "09:58" },
  "20/05/2023": { "age of": "06:52" },
  "21/05/2023": { "age of": "03:39" },
  "22/05/2023": { "age of": "02:55" },
  "23/05/2023": { "age of": "03:09" },
  "30/05/2023": { "age of": "04:05" },
  "31/05/2023": { "age of": "04:05" },
  "02/06/2023": { "age of": "03:30" },
  "03/06/2023": { "age of": "06:00" },
  "04/06/2023": { "age of": "02:45" },
  "07/06/2023": { "age of": "02:30" },
  "08/06/2023": { "age of": "03:00" },
  "11/06/2023": { "age of": "03:00" },
  "12/06/2023": { "age of": "01:30" },
  "14/06/2023": { "age of": "03:20" },
  "15/06/2023": { "age of": "03:00" },
  "16/06/2023": { "age of": "04:00" },
  "17/06/2023": { "age of": "02:40" },
  "28/06/2023": { "age of": "01:36" },
  "29/06/2023": { "age of": "03:00" },
  "30/06/2023": { "age of": "02:20" },
  "01/07/2023": { "age of": "02:50" },
  "03/07/2023": { "age of": "00:15" },
  "04/07/2023": { "age of": "01:00" },
  "29/07/2023": { "age of": "03:08" },
  "30/07/2023": { "age of": "01:12" },
  "02/08/2023": { "age of": "01:18" },
  "07/08/2023": { "ManorL": "1:43" },
  "12/08/2023": { "ManorL": "3:30" },
  "13/08/2023": { "ManorL": "3:37" },
  "20/08/2023": { "ManorL": "3:45" },
  "21/08/2023": { "ManorL": "0:42" },
  "23/08/2023": { "ManorL": "1:37" },
  "24/08/2023": { "ManorL": "1:44" },
  "25/08/2023": { "ManorL": "2:15" },
  "26/08/2023": { "ManorL": "4:10" },
  "27/08/2023": { "fc": "01:00", "med dyn": "04:00" },
  "31/08/2023": { "sengoku": "02:20" },
  "02/09/2023": { "sengoku": "00:53" },
  "03/09/2023": { "sengoku": "02:00" },
  "04/09/2023": { "fc": "01:15" },
  "07/09/2023": { "fc": "05:15" },
  "08/09/2023": { "fc": "01:34" },
  "11/09/2023": { "fc": "02:24" },
  "12/09/2023": { "fc": "01:20" },
  "14/09/2023": { "fc": "01:27" },
  "15/09/2023": { "fc": "03:23" },
  "17/09/2023": { "fc": "01:05" },
  "19/09/2023": { "fc": "02:39" },
  "20/09/2023": { "fc": "01:34" },
  "21/09/2023": { "fc": "00:42" },
  "23/09/2023": { "fc": "01:00" },
  "24/09/2023": { "fc": "02:20" },
  "26/09/2023": { "fc": "04:15" },
  "27/09/2023": { "fc": "04:20" },
  "28/09/2023": { "fc": "03:24" },
  "29/09/2023": { "fc": "02:08" },
  "01/10/2023": { "ManorL": "4:15" },
  "02/10/2023": { "ManorL": "1:15" },
  "04/10/2023": { "ManorL": "1:51" },
  "09/10/2023": { "ManorL": "1:14" },
  "10/10/2023": { "ManorL": "4:00" },
  "12/10/2023": { "ManorL": "2:55" },
  "13/10/2023": { "ManorL": "4:30" },
  "15/10/2023": { "ManorL": "3:40" },
  "18/10/2023": { "ManorL": "2:15" },
  "19/10/2023": { "ManorL": "4:30" },
  "21/10/2023": { "ManorL": "4:45" },
  "22/10/2023": { "ManorL": "1:50" },
  "23/10/2023": { "ManorL": "2:40" },
  "24/10/2023": { "ManorL": "1:45" },
  "28/10/2023": { "ManorL": "2:50" },
  "29/10/2023": { "ManorL": "3:20" },
  "01/11/2023": { "ManorL": "4:36" },
  "02/11/2023": { "ManorL": "1:08" },
  "04/11/2023": { "ManorL": "3:01" },
  "05/11/2023": { "ManorL": "2:01" },
  "07/11/2023": { "ManorL": "1:00" },
  "10/11/2023": { "ManorL": "2:30" },
  "12/11/2023": { "ManorL": "1:20" },
  "18/11/2023": { "ManorL": "3:00" },
  "19/11/2023": { "ManorL": "2:52" },
  "21/11/2023": { "ManorL": "2:15" },
  "23/11/2023": { "x": "01:10" },
  "24/11/2023": { "ManorL": "3:34" },
  "26/11/2023": { "ManorL": "3:00" },
  "01/12/2023": { "ManorL": "1:50" },
  "03/12/2023": { "ManorL": "0:43" },
  "04/12/2023": { "ManorL": "1:32" },
  "05/12/2023": { "ManorL": "1:48" },
  "06/12/2023": { "ManorL": "2:21" },
  "07/12/2023": { "ManorL": "3:26" },
  "09/12/2023": { "ManorL": "2:04" },
  "11/12/2023": { "ManorL": "1:32" },
  "15/12/2023": { "ManorL": "2:40" },
  "16/12/2023": { "ManorL": "3:17" },
  "18/12/2023": { "ManorL": "3:10" },
  "20/12/2023": { "ManorL": "5:00" },
  "21/12/2023": { "ManorL": "1:57" },
  "22/12/2023": { "ManorL": "2:15" },
  "24/12/2023": { "ManorL": "3:50" },
  "26/12/2023": { "ManorL": "2:32" },
  "27/12/2023": { "ManorL": "2:13" },
  "28/12/2023": { "ManorL": "3:24" },
  "06/01/2024": { "ManorL": "3:00" },
  "07/01/2024": { "ManorL": "3:20" },
  "08/01/2024": { "ManorL": "6:40" },
  "09/01/2024": { "ManorL": "5:30" },
  "10/01/2024": { "ManorL": "3:25" },
  "11/01/2024": { "ManorL": "3:51" },
  "17/01/2024": { "Bellwright": "01:00" },
  "18/01/2024": { "Bellwright": "02:45" },
  "20/01/2024": { "Bellwright": "04:00" },
  "21/01/2024": { "Bellwright": "02:00" },
  "22/01/2024": { "Bellwright": "03:00" },
  "23/01/2024": { "Bellwright": "06:20" },
  "24/01/2024": { "Bellwright": "03:00" },
  "26/01/2024": { "Bellwright": "04:20" },
  "28/01/2024": { "Bellwright": "03:14" },
  "29/01/2024": { "Bellwright": "02:48" },
  "31/01/2024": { "Bellwright": "01:34" },
  "01/02/2024": { "Bellwright": "02:18" },
  "03/02/2024": { "Bellwright": "04:05" },
  "04/02/2024": { "Bellwright": "02:30" },
  "05/02/2024": { "Bellwright": "03:51" },
  "12/03/2024": { "ManorL": "3:46" },
  "13/03/2024": { "ManorL": "3:30" },
  "14/03/2024": { "ManorL": "1:40" },
  "17/03/2024": { "ManorL": "1:55" },
  "18/03/2024": { "ManorL": "2:30" },
  "20/03/2024": { "ManorL": "3:30" },
  "22/03/2024": { "ManorL": "2:25" },
  "24/03/2024": { "ManorL": "3:38" },
  "26/03/2024": { "ManorL": "3:50" },
  "27/03/2024": { "ManorL": "2:12" },
  "31/03/2024": { "ManorL": "1:40" },
  "01/04/2024": { "ManorL": "0:19" },
  "03/04/2024": { "ManorL": "5:30" },
  "08/04/2024": { "ManorL": "2:00" },
  "09/04/2024": { "ManorL": "2:30" },
  "10/04/2024": { "ManorL": "1:05" },
  "11/04/2024": { "ManorL": "1:51" },
  "12/04/2024": { "ManorL": "2:16" },
  "13/04/2024": { "ManorL": "2:25" },
  "14/04/2024": { "ManorL": "5:05" },
  "15/04/2024": { "ManorL": "3:05" },
  "16/04/2024": { "ManorL": "1:39" },
  "17/04/2024": { "ManorL": "4:05" },
  "18/04/2024": { "ManorL": "1:00" },
  "19/04/2024": { "ManorL": "3:30" },
  "20/04/2024": { "ManorL": "5:50" },
  "22/04/2024": { "ManorL": "6:00" },
  "28/04/2024": { "BDG 3": "01:00" },
  "30/04/2024": { "BDG 3": "01:30" },
  "01/05/2024": { "BDG 3": "02:00" },
  "02/05/2024": { "BDG 3": "03:24" },
  "03/05/2024": { "BDG 3": "02:20" },
  "05/05/2024": { "BDG 3": "06:10" },
  "06/05/2024": { "BDG 3": "02:53" },
  "07/05/2024": { "BDG 3": "02:20" },
  "09/05/2024": { "BDG 3": "02:30" },
  "10/05/2024": { "BDG 3": "02:00" },
  "11/05/2024": { "BDG 3": "01:45" },
  "12/05/2024": { "BDG 3": "06:20" },
  "13/05/2024": { "BDG 3": "02:10" },
  "15/05/2024": { "BDG 3": "05:30" },
  "16/05/2024": { "BDG 3": "03:15" },
  "17/05/2024": { "BDG 3": "03:30" },
  "18/05/2024": { "BDG 3": "02:00" },
  "19/05/2024": { "BDG 3": "02:40" },
  "21/05/2024": { "BDG 3": "05:05" },
  "22/05/2024": { "BDG 3": "03:30" },
  "29/05/2024": { "BDG 3": "04:30" },
  "30/05/2024": { "BDG 3": "01:50" },
  "31/05/2024": { "BDG 3": "03:45" },
  "01/06/2024": { "BDG 3": "03:34" },
  "02/06/2024": { "BDG 3": "05:00" },
  "20/07/2024": { "BDG 3": "04:00" },
  "21/07/2024": { "BDG 3": "04:26" },
  "22/07/2024": { "BDG 3": "02:30" },
  "23/07/2024": { "BDG 3": "05:30" },
  "24/07/2024": { "BDG 3": "01:35" },
  "25/07/2024": { "BDG 3": "01:10" },
  "21/08/2024": { "Stranded alien dawn": "02:30" },
  "22/08/2024": { "Stranded alien dawn": "04:30" },
  "23/08/2024": { "Stranded alien dawn": "09:30" },
  "24/08/2024": { "Stranded alien dawn": "04:20" },
  "03/09/2024": { "Stranded alien dawn": "05:00" },
  "04/09/2024": { "Stranded alien dawn": "05:30" },
  "05/09/2024": { "Stranded alien dawn": "02:00" },
  "06/09/2024": { "Stranded alien dawn": "02:15" },
  "07/09/2024": { "Stranded alien dawn": "03:45" },
  "19/09/2024": { "Stranded alien dawn": "01:30" },
  "23/09/2024": { "ManorL": "2:00" },
  "24/09/2024": { "ManorL": "2:10" },
  "26/09/2024": { "ManorL": "2:20" },
  "11/11/2024": { "ManorL": "2:00" },
  "12/11/2024": { "ManorL": "4:00" },
  "13/11/2024": { "ManorL": "3:40" },
  "14/11/2024": { "ManorL": "2:52" },
  "15/11/2024": { "ManorL": "3:00" },
  "17/11/2024": { "ManorL": "3:30" },
  "18/11/2024": { "ManorL": "2:35" },
  "19/11/2024": { "ManorL": "4:36" },
  "20/11/2024": { "ManorL": "1:26" },
  "21/11/2024": { "ManorL": "2:00" },
  "22/11/2024": { "ManorL": "1:05" },
  "17/05/2025": { "ManorL": "2:00" },
  "18/05/2025": { "ManorL": "1:30" },
  "19/05/2025": { "ManorL": "1:15" },
  "22/05/2025": { "ManorL": "2:00" },
  "23/05/2025": { "ManorL": "2:25" },
  "26/05/2025": { "ManorL": "2:05" },
  "27/05/2025": { "ManorL": "1:10" },
  "28/05/2025": { "ManorL": "1:40" },
  "29/05/2025": { "ManorL": "1:30" },
  "01/06/2025": { "ManorL": "1:00" },
  "02/06/2025": { "ManorL": "1:15" },
  "03/06/2025": { "ManorL": "01:45" },
  "05/06/2025": { "ManorL": "1:20" },
  "06/06/2025": { "ManorL": "6:15" },
  "07/06/2025": { "ManorL": "3:00" },
  "08/06/2025": { "ManorL": "1:50" },
  "11/06/2025": { "ManorL": "0:55" },
  "12/06/2025": { "ManorL": "1:45" },
  "15/06/2025": { "ManorL": "3:00" },
  "19/06/2025": { "ManorL": "2:30" },
  "20/06/2025": { "ManorL": "1:00" },
  "22/06/2025": { "ManorL": "0:45" },
  "24/06/2025": { "ManorL": "3:20" },
  "26/06/2025": { "ManorL": "1:05" },
  "27/06/2025": { "ManorL": "2:25" },
  "28/06/2025": { "ManorL": "1:35" },
  "02/07/2025": { "ManorL": "0:52" },
  "03/07/2025": { "ManorL": "4:30" },
  "04/07/2025": { "ManorL": "1:40" },
  "06/07/2025": { "ManorL": "1:04" },
  "07/07/2025": { "ManorL": "1:08" },
  "08/07/2025": { "ManorL": "1:05" },
  "14/07/2025": { "ManorL": "1:30" },
  "16/07/2025": { "ManorL": "4:50" },
  "23/07/2025": { "BDG 3": "05:00" },
  "24/07/2025": { "BDG 3": "01:44", "fc": "03:29" },
  "27/07/2025": { "fc": "03:00" },
  "28/07/2025": { "fc": "05:15" },
  "29/07/2025": { "fc": "05:09" },
  "01/08/2025": { "fc": "02:39" },
  "02/08/2025": { "fc": "07:30" },
  "03/08/2025": { "fc": "06:20" },
  "04/08/2025": { "fc": "01:54" },
  "05/08/2025": { "fc": "02:55" },
  "16/08/2025": { "fc": "01:35" },
  "01/10/2025": { "Stranded alien dawn": "05:20" },
  "02/10/2025": { "Stranded alien dawn": "02:30" },
  "05/10/2025": { "Stranded alien dawn": "07:36" },
  "07/10/2025": { "Stranded alien dawn": "01:50" },
  "08/10/2025": { "Stranded alien dawn": "12:15" },
  "09/10/2025": { "Stranded alien dawn": "08:20" },
  "10/10/2025": { "Stranded alien dawn": "06:20" },
  "12/10/2025": { "Stranded alien dawn": "01:50" },
  "13/10/2025": { "Stranded alien dawn": "04:31" },
  "14/10/2025": { "Stranded alien dawn": "02:53" },
  "15/10/2025": { "Stranded alien dawn": "07:32" },
  "16/10/2025": { "Stranded alien dawn": "01:56" },
  "19/10/2025": { "Stranded alien dawn": "03:17" },
  "20/10/2025": { "Stranded alien dawn": "07:30" },
  "22/10/2025": { "Stranded alien dawn": "05:28" },
  "23/10/2025": { "Stranded alien dawn": "05:29" },
  "25/10/2025": { "Stranded alien dawn": "06:01" },
  "26/10/2025": { "Stranded alien dawn": "04:11" },
  "05/11/2025": { "Stranded alien dawn": "04:41" },
  "06/11/2025": { "Stranded alien dawn": "07:59" },
  "09/11/2025": { "Stranded alien dawn": "06:17" },
  "11/11/2025": { "Stranded alien dawn": "04:00" },
  "12/11/2025": { "Stranded alien dawn": "05:00" },
  "14/11/2025": { "Stranded alien dawn": "01:45" },
  "15/11/2025": { "Stranded alien dawn": "03:23" },
  "16/11/2025": { "Stranded alien dawn": "05:42" },
  "19/11/2025": { "Stranded alien dawn": "03:12" },
  "20/11/2025": { "Stranded alien dawn": "00:30" },
  "17/12/2025": { "ManorL": "3:18" },
  "24/12/2025": { "ManorL": "1:35" },
  "25/12/2025": { "ManorL": "4:32" },
  "26/12/2025": { "diplomacie inao": "00:58", "ManorL": "2:55" },
  "27/12/2025": { "ManorL": "2:38" },
  "28/12/2025": { "ManorL": "1:14" },
  "01/01/2026": { "BDG 3": "01:55" },
  "02/01/2026": { "BDG 3": "01:10" },
  "03/01/2026": { "ManorL": "2:16" },
  "04/01/2026": { "ManorL": "3:00" },
  "06/01/2026": { "ManorL": "3:28" },
  "07/01/2026": { "ManorL": "4:24" },
  "08/01/2026": { "ManorL": "2:24" },
  "09/01/2026": { "ManorL": "1:48" },
  "12/01/2026": { "ManorL": "2:03" },
  "13/01/2026": { "ManorL": "1:26" },
  "14/01/2026": { "ManorL": "4:24" },
  "15/01/2026": { "ManorL": "1:43" },
  "17/01/2026": { "ManorL": "4:52" },
  "18/01/2026": { "ManorL": "4:36" },
  "19/01/2026": { "ManorL": "1:45" },
  "20/01/2026": { "ManorL": "2:59" },
  "21/01/2026": { "ManorL": "4:04" },
  "23/01/2026": { "ManorL": "6:35" },
  "15/02/2026": { "tcg": "04:17" },
  "16/02/2026": { "tcg": "03:44" },
  "17/02/2026": { "tcg": "02:57" },
  "18/02/2026": { "tcg": "01:41" },
  "19/02/2026": { "tcg": "05:24" },
  "20/02/2026": { "tcg": "01:10" },
  "21/02/2026": { "tcg": "00:46" },
  "22/02/2026": { "tcg": "01:57" },
  "23/02/2026": { "tcg": "03:51" },
  "24/02/2026": { "tcg": "06:00" },
  "03/03/2026": { "PARKinect": "01:03" },
  "04/03/2026": { "PARKinect": "03:14" },
  "13/03/2026": { "diplomacie inao": "03:10" },
  "17/03/2026": { "Going Medieval": "02:09" },
  "20/03/2026": { "Going Medieval": "07:49" },
  "26/03/2026": { "Going Medieval": "02:00" },
  "16/07/2026": { "ManorL": "1:00" },
  "17/07/2026": { "ManorL": "3:00" },
  "26/07/2026": { "ManorL": "1:10" },
  "27/07/2026": { "ManorL": "2:39" },
  "28/07/2026": { "diplomacie inao": "02:52", "ManorL": "3:05" },
  "29/07/2026": { "diplomacie inao": "06:00" },
  "30/07/2026": { "diplomacie inao": "08:16" },
  "31/07/2026": { "diplomacie inao": "04:00" },
  "01/08/2026": { "diplomacie inao": "04:59" },
  "03/08/2026": { "diplomacie inao": "00:55" },
  "04/08/2026": { "diplomacie inao": "02:33" },
  "05/08/2026": { "diplomacie inao": "08:26" },
  "07/08/2026": { "diplomacie inao": "02:15" },
  "08/08/2026": { "diplomacie inao": "01:56" },
  "10/08/2026": { "diplomacie inao": "01:33" },
  "11/08/2026": { "diplomacie inao": "01:51" },
  "13/08/2026": { "diplomacie inao": "05:03" },
  "15/08/2026": { "diplomacie inao": "02:25" },
  "17/08/2026": { "diplomacie inao": "02:00" },
  "18/08/2026": { "diplomacie inao": "02:33" },
  "19/08/2026": { "ManorL": "3:32" },
  "21/08/2026": { "ManorL": "3:08" },
  "22/08/2026": { "ManorL": "2:52" },
  "23/08/2026": { "ManorL": "1:52" },
  "24/08/2026": { "ManorL": "1:08" },
  "25/08/2026": { "ManorL": "3:25" },
  "26/08/2026": { "ManorL": "1:49" },
  "28/08/2026": { "ManorL": "1:30" },
  "29/08/2026": { "ManorL": "8:10" },
  "31/08/2026": { "ManorL": "4:33" },
  "01/09/2026": { "ManorL": "1:00" },
  "03/09/2026": { "ManorL": "3:17" },
  "04/09/2026": { "ManorL": "2:00" }
};

export function parseDurationToMinutes(val: string | undefined): number {
  if (!val) return 0;
  const clean = String(val).trim().replace(/"/g, "").replace(",", ".");
  if (!clean || clean === "0" || clean === "0:00:00" || clean === "0:00") return 0;

  if (clean.includes(":")) {
    const parts = clean.split(":").map(Number);
    if (parts.length === 3) {
      return (parts[0] || 0) * 60 + (parts[1] || 0) + Math.round((parts[2] || 0) / 60);
    }
    if (parts.length === 2) {
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
  }

  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return Math.round(num * 60);
  }
  return 0;
}

export function formatMinutesToTime(mins: number): string {
  const isNeg = mins < 0;
  const absM = Math.abs(mins);
  const h = Math.floor(absM / 60);
  const m = absM % 60;
  const sign = isNeg ? "-" : "";
  return `${sign}${h}:${String(m).padStart(2, "0")}:00`;
}

export function formatAverageMinutesToTime(mins: number): string {
  const isNeg = mins < 0;
  const absM = Math.abs(mins);
  const totalSec = Math.round(absM * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const sign = isNeg ? "-" : "";
  return `${sign}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatShortHoursMinutes(mins: number): string {
  const absM = Math.abs(mins);
  const h = Math.floor(absM / 60);
  const m = absM % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

// Convertit YYYY-MM-DD en DD/MM/YYYY
export function isoToFrenchDate(isoStr: string): string {
  const parts = isoStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

// Convertit DD/MM/YYYY en objet Date
export function frenchDateToDate(frenchStr: string): Date {
  const parts = frenchStr.split("/").map(Number);
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

/**
 * Convertit un index de colonne (0-based) en lettres de colonne de tableur (ex: 0 -> A, 1 -> B, ..., 26 -> AA).
 */
export function columnIndexToLetter(index: number): string {
  let temp = index;
  let letter = "";
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Détermine avec certitude si une récompense loisir est un jeu vidéo :
 * 1. Propriété explicite isGame si définie (true ou false)
 * 2. Détection par correspondance titre/mots-clés/jeux historiques par défaut si non spécifié
 */
export function isRewardGame(r: Reward): boolean {
  if (r.isGame === true) return true;
  if (r.isGame === false) return false;
  const clean = (r.title || "").toLowerCase();
  return /jeu|game|gaming/i.test(clean) || LEGACY_GAMES.some((g) => g.toLowerCase() === clean || clean.includes(g.toLowerCase()));
}

/**
 * Construit l'intégralité des lignes tabulaires de la feuille "archive jeux"
 * en fusionnant fidèlement les données anciennes avec les nouvelles données de l'application.
 */
export function buildArchiveJeuxSheet(db: AppDatabase): any[][] {
  const gamesList = [...LEGACY_GAMES];
  const mergedDayLogs = new Map<string, Record<string, number>>();

  // 1. Charger les logs historiques
  Object.entries(LEGACY_LOGS).forEach(([dStr, gameMap]) => {
    const dayMap: Record<string, number> = {};
    Object.entries(gameMap).forEach(([gName, valStr]) => {
      const mins = parseDurationToMinutes(valStr);
      if (mins > 0) {
        dayMap[gName] = (dayMap[gName] || 0) + mins;
      }
    });
    mergedDayLogs.set(dStr, dayMap);
  });

  // 2. Extraire et fusionner les nouveaux logs de l'application (Boutique Loisirs / Tâches Jeux)
  const appGameLogs: Array<{ dateFrench: string; gameTitle: string; durationMinutes: number }> = [];

  (db.rewards || []).forEach((r) => {
    // Ne prendre en compte que si la récompense est un jeu vidéo
    if (!isRewardGame(r)) return;

    if (r.timeLog && Array.isArray(r.timeLog)) {
      const cleanTitle = (r.title || "").replace(/^[^\w\s]+/, "").trim(); // Enlever l'émoji éventuel
      r.timeLog.forEach((log) => {
        if (log.duration && log.duration > 0 && log.date) {
          appGameLogs.push({
            dateFrench: isoToFrenchDate(log.date),
            gameTitle: cleanTitle || "Jeu",
            durationMinutes: log.duration,
          });
        }
      });
    }
  });

  (db.tasks || []).forEach((t) => {
    const isGamingTask = (t.tags || []).some((tag) => /jeu|gaming|game/i.test(tag));
    if (isGamingTask) {
      const cleanTitle = (t.title || "").trim();
      if (t.workHistory) {
        Object.entries(t.workHistory).forEach(([isoD, sec]) => {
          const mins = Math.floor(sec / 60);
          if (mins > 0) {
            appGameLogs.push({
              dateFrench: isoToFrenchDate(isoD),
              gameTitle: cleanTitle,
              durationMinutes: mins,
            });
          }
        });
      }
    }
  });

  // Fusionner les nouveaux logs dans mergedDayLogs
  appGameLogs.forEach(({ dateFrench, gameTitle, durationMinutes }) => {
    // Tenter de matcher avec une colonne de jeu existante
    let matchedGame = gamesList.find(
      (g) => g.toLowerCase() === gameTitle.toLowerCase() || gameTitle.toLowerCase().includes(g.toLowerCase())
    );

    if (!matchedGame) {
      // Nouvelle colonne de jeu
      matchedGame = gameTitle;
      gamesList.push(matchedGame);
    }

    const dayMap = mergedDayLogs.get(dateFrench) || {};
    dayMap[matchedGame] = (dayMap[matchedGame] || 0) + durationMinutes;
    mergedDayLogs.set(dateFrench, dayMap);
  });

  // 3. Générer le calendrier continu complet de 22/03/2022 jusqu'au 01/09/2027 (ou aujourd'hui)
  const startDate = new Date(2022, 2, 22); // 22 Mars 2022
  const maxFixedDate = new Date(2027, 8, 1); // 1er Septembre 2027
  const now = new Date();
  const endDate = now > maxFixedDate ? now : maxFixedDate;

  // Calcul du nombre de jours réels écoulés entre la date de départ et aujourd'hui
  const msPerDay = 1000 * 3600 * 24;
  const elapsedDaysToNow = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / msPerDay));
  const authorizedMinutes = elapsedDaysToNow * 60; // 1 heure autorisée par jour

  // Générer toutes les dates intermédiaires
  const calendarDates: string[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const day = String(cur.getDate()).padStart(2, "0");
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const y = cur.getFullYear();
    calendarDates.push(`${day}/${m}/${y}`);
    cur.setDate(cur.getDate() + 1);
  }

  // Calculer les totaux globaux et par jeu
  let totalPlayedMinutes = 0;
  const gameTotalMinutes: Record<string, number> = {};
  gamesList.forEach((g) => (gameTotalMinutes[g] = 0));

  calendarDates.forEach((dStr) => {
    const dayMap = mergedDayLogs.get(dStr);
    if (dayMap) {
      Object.entries(dayMap).forEach(([g, m]) => {
        totalPlayedMinutes += m;
        gameTotalMinutes[g] = (gameTotalMinutes[g] || 0) + m;
      });
    }
  });

  const remainingMinutes = authorizedMinutes - totalPlayedMinutes;
  const overallAvgMinutesPerDay = elapsedDaysToNow > 0 ? totalPlayedMinutes / elapsedDaysToNow : 0;
  const yearsElapsed = (elapsedDaysToNow / 365).toFixed(9);

  // 4. Construction de la feuille dans le format d'origine exact avec formules dynamiques
  const sheetRows: any[][] = [];

  const lastRow = 10 + calendarDates.length;
  const lastColLetter = columnIndexToLetter(2 + gamesList.length);

  // Ligne 1 : vide
  sheetRows.push(new Array(gamesList.length + 3).fill(""));

  // Ligne 2 : Date de départ
  const r2 = new Array(gamesList.length + 3).fill("");
  r2[2] = "22/03/2022";
  sheetRows.push(r2);

  // Ligne 3 : Date de fin / Aujourd'hui (formule AUJOURDHUI dynamique)
  const r3 = new Array(gamesList.length + 3).fill("");
  r3[2] = "=AUJOURDHUI()";
  sheetRows.push(r3);

  // Ligne 4 : Jours écoulés (formule C3-C2)
  const r4 = new Array(gamesList.length + 3).fill("");
  r4[0] = "=C3-C2";
  r4[1] = "jours";
  sheetRows.push(r4);

  // Ligne 5 : Heures autorisées (1h / jour, formule A4/24)
  const r5 = new Array(gamesList.length + 3).fill("");
  r5[0] = "=A4/24";
  r5[1] = "h autorisées";
  sheetRows.push(r5);

  // Ligne 6 : Années & Moyennes par jeu (formules A4/365 et TotalJeu/$A$4)
  const r6 = new Array(gamesList.length + 3).fill("");
  r6[0] = "=A4/365";
  r6[2] = "=C7/$A$4";
  gamesList.forEach((_, idx) => {
    const colLetter = columnIndexToLetter(3 + idx);
    r6[3 + idx] = `=${colLetter}7/$A$4`;
  });
  sheetRows.push(r6);

  // Ligne 7 : Moy/j globale & Totaux cumulés par jeu (formules SOMME)
  const r7 = new Array(gamesList.length + 3).fill("");
  r7[0] = "=C7/$A$4";
  r7[1] = "moy/j";
  r7[2] = `=SOMME(D7:${lastColLetter}7)`;
  gamesList.forEach((_, idx) => {
    const colLetter = columnIndexToLetter(3 + idx);
    r7[3 + idx] = `=SOMME(${colLetter}11:${colLetter}${lastRow})`;
  });
  sheetRows.push(r7);

  // Ligne 8 : Heures restantes (formule A5-C7)
  const r8 = new Array(gamesList.length + 3).fill("");
  r8[0] = "=A5-C7";
  r8[1] = "h restantes";
  sheetRows.push(r8);

  // Ligne 9 : vide
  sheetRows.push(new Array(gamesList.length + 3).fill(""));

  // Ligne 10 : En-têtes de colonnes
  const r10 = new Array(gamesList.length + 3).fill("");
  r10[2] = "date";
  gamesList.forEach((g, idx) => {
    r10[3 + idx] = g;
  });
  sheetRows.push(r10);

  // Lignes 11+ : Chaque date du calendrier avec formule SOMME pour le total journalier en colonne B
  calendarDates.forEach((dStr, dateIdx) => {
    const rowIndex = 11 + dateIdx;
    const row = new Array(gamesList.length + 3).fill("");
    const dayMap = mergedDayLogs.get(dStr);

    if (dayMap) {
      gamesList.forEach((g, idx) => {
        const valM = dayMap[g];
        if (valM && valM > 0) {
          row[3 + idx] = formatShortHoursMinutes(valM);
        }
      });
    }

    row[1] = `=SOMME(D${rowIndex}:${lastColLetter}${rowIndex})`;
    row[2] = dStr;
    sheetRows.push(row);
  });

  return sheetRows;
}
