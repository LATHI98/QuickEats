import time
from datetime import datetime

import cv2
import requests
from ultralytics import YOLO

# API endpoint that receives crowd count updates.
API_URL = 'http://localhost:5000/api/crowd'
# Send count updates every 2 seconds.
SEND_INTERVAL_SECONDS = 0.25
# Confidence threshold to reduce weak detections.
CONFIDENCE_THRESHOLD = 0.35


def send_count_to_backend(count: int) -> None:
    """Send the latest people count to the backend API."""
    payload = {
        'count': count,
        'timestamp': datetime.utcnow().isoformat(),
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=3)
        response.raise_for_status()
        print(f'[API] Sent count={count} status={response.status_code}')
    except requests.RequestException as error:
        # Keep detection running even if API call fails temporarily.
        print(f'[API] Failed to send count: {error}')


def count_people_from_results(results) -> int:
    """Count YOLO detections that belong to class 0 (person)."""
    people_count = 0

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        class_ids = boxes.cls.tolist()
        for class_id in class_ids:
            if int(class_id) == 0:
                people_count += 1

    return people_count


def run_crowd_detector() -> None:
    """Run webcam-based crowd detection continuously."""
    print('[INIT] Loading YOLOv8 model...')
    model = YOLO('yolov8n.pt')
    print('[INIT] YOLOv8 model loaded.')

    # Open default laptop webcam.
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        raise RuntimeError('Could not open webcam. Check camera permissions.')

    last_sent_time = 0.0

    try:
        while True:
            success, frame = camera.read()
            if not success:
                print('[WARN] Failed to read webcam frame; retrying...')
                time.sleep(0.1)
                continue

            # Run YOLO inference on the current frame.
            results = model.predict(source=frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
            people_count = count_people_from_results(results)

            current_time = time.time()
            if current_time - last_sent_time >= SEND_INTERVAL_SECONDS:
                send_count_to_backend(people_count)
                last_sent_time = current_time

            # Draw detections and useful labels for local monitoring.
            annotated_frame = results[0].plot()
            cv2.putText(
                annotated_frame,
                f'People: {people_count}',
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2,
            )

            cv2.imshow('QuickEats Crowd Detector (Press q to quit)', annotated_frame)

            # Exit gracefully when user presses q.
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print('[INFO] Exit requested by user.')
                break
    except KeyboardInterrupt:
        print('\n[INFO] Crowd detector stopped by keyboard interrupt.')
    except Exception as error:
        print(f'[ERROR] Unexpected runtime error: {error}')
    finally:
        camera.release()
        cv2.destroyAllWindows()
        print('[CLEANUP] Camera released and windows closed.')


if __name__ == '__main__':
    run_crowd_detector()
