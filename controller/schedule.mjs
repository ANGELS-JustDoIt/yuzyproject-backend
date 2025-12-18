import * as scheduleRepository from "../data/schedule.mjs";

// snake_case를 camelCase로 변환하는 헬퍼 함수
function toCamelCase(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const camelObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    camelObj[camelKey] = value;
  }
  return camelObj;
}

// 일정 등록
export async function createSchedule(req, res, next) {
  try {
    const { title, description, scheduleDate } = req.body;
    const userIdx = req.userIdx; // 인증 미들웨어에서 설정된 user ID

    // 필수 필드 검증
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "제목을 입력하세요." });
    }

    if (!scheduleDate) {
      return res.status(400).json({ message: "일정 날짜를 입력하세요." });
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduleDate)) {
      return res
        .status(400)
        .json({ message: "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)" });
    }

    // 일정 생성
    const schedule = await scheduleRepository.create(
      userIdx,
      title.trim(),
      description ? description.trim() : null,
      scheduleDate
    );

    res.status(201).json({
      message: "일정이 성공적으로 등록되었습니다.",
      schedule: toCamelCase(schedule),
    });
  } catch (error) {
    console.error("일정 등록 에러:", error);
    res.status(500).json({
      message: "일정 등록에 실패했습니다.",
      error: error.message,
    });
  }
}

// 일정 조회
export async function getSchedules(req, res, next) {
  try {
    const userIdx = req.userIdx;
    const { startDate, endDate } = req.query;

    // 날짜 범위 조회 (또는 전체 조회)
    const schedules = await scheduleRepository.getSchedules(
      userIdx,
      startDate || null,
      endDate || null
    );

    res.status(200).json({
      schedules: schedules.map((schedule) => toCamelCase(schedule)),
    });
  } catch (error) {
    console.error("일정 조회 에러:", error);
    res.status(500).json({
      message: "일정 조회에 실패했습니다.",
      error: error.message,
    });
  }
}

// 일정 수정
export async function updateSchedule(req, res, next) {
  try {
    const scheduleId = parseInt(req.params.id);
    const { title, description, scheduleDate } = req.body;
    const userIdx = req.userIdx;

    if (!scheduleId || isNaN(scheduleId)) {
      return res.status(400).json({ message: "유효하지 않은 일정 ID입니다." });
    }

    // 필수 필드 검증
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "제목을 입력하세요." });
    }

    if (!scheduleDate) {
      return res.status(400).json({ message: "일정 날짜를 입력하세요." });
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduleDate)) {
      return res
        .status(400)
        .json({ message: "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)" });
    }

    // 일정 존재 및 소유권 확인
    const existingSchedule = await scheduleRepository.getById(scheduleId);
    if (!existingSchedule) {
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
    }

    if (existingSchedule.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "본인의 일정만 수정할 수 있습니다." });
    }

    // 일정 수정
    const schedule = await scheduleRepository.update(
      scheduleId,
      userIdx,
      title.trim(),
      description ? description.trim() : null,
      scheduleDate
    );

    res.status(200).json({
      message: "일정이 성공적으로 수정되었습니다.",
      schedule: toCamelCase(schedule),
    });
  } catch (error) {
    console.error("일정 수정 에러:", error);
    res.status(500).json({
      message: "일정 수정에 실패했습니다.",
      error: error.message,
    });
  }
}

// 일정 삭제
export async function deleteSchedule(req, res, next) {
  try {
    const scheduleId = parseInt(req.params.id);
    const userIdx = req.userIdx;

    if (!scheduleId || isNaN(scheduleId)) {
      return res.status(400).json({ message: "유효하지 않은 일정 ID입니다." });
    }

    // 일정 존재 및 소유권 확인
    const existingSchedule = await scheduleRepository.getById(scheduleId);
    if (!existingSchedule) {
      return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
    }

    if (existingSchedule.user_idx !== userIdx) {
      return res
        .status(403)
        .json({ message: "본인의 일정만 삭제할 수 있습니다." });
    }

    // 일정 삭제
    const deleted = await scheduleRepository.deleteById(scheduleId, userIdx);
    if (!deleted) {
      return res.status(500).json({ message: "일정 삭제에 실패했습니다." });
    }

    res.status(200).json({
      message: "일정이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("일정 삭제 에러:", error);
    res.status(500).json({
      message: "일정 삭제에 실패했습니다.",
      error: error.message,
    });
  }
}
