import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Container, Row, Col } from "react-bootstrap";

const preferences = [
  { id: 1, title: "Are you a Night Owl or Early Bird?", options: ["Night Owl", "Early Bird"] },
  { id: 2, title: "Do you prefer a clean room?", options: ["Very Clean", "Moderate", "Messy"] },
  { id: 3, title: "Do you like socializing?", options: ["Yes", "No", "Sometimes"] },
];

export default function OnboardingSwipe() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleSelect = (option) => {
    setAnswers({ ...answers, [preferences[index].id]: option });
    if (index < preferences.length - 1) {
      setIndex(index + 1);
    } else {
      alert("Preferences saved!"); // Replace with navigation logic
    }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center vh-100 bg-primary text-white p-4">
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <AnimatePresence>
            <motion.div
              key={preferences[index].id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="p-4 bg-light text-dark shadow-lg rounded">
                <Card.Body>
                  <h2 className="text-center mb-4">{preferences[index].title}</h2>
                  <div className="d-grid gap-3">
                    {preferences[index].options.map((option) => (
                      <Button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className="btn-lg btn-primary"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Col>
      </Row>
    </Container>
  );
}
