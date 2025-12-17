# Helper Commands for Maven with Checkstyle
# Executa apenas o Google Checks
mvn validate

# Executa ambos (Google + Custom)
mvn verify

# Executa diretamente o Checkstyle
mvn checkstyle:check

# Build completo com todas as verificações
mvn clean install