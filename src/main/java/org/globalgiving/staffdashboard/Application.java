package org.globalgiving.staffdashboard;

import lombok.Generated;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.ImportResource;

/** Spring boot application class. */
@SpringBootApplication
@ComponentScan({"org.globalgiving.staffdashboard", "org.globalgiving.designsystem.spring"})
// This is a sub-set of our full set of beans. Long term, I think we may want to build up a
// 'staff-dashboard profile so that all XML files are included but only related beans are activated
// If something is missing, the full list that the main website uses is in
// /webapp-dy/src/main/webapp/WEB-INF/web.xml
@ImportResource({
  "classpath:org/globalgiving/spring/applicationContext.xml",
  "classpath:org/globalgiving/spring/applicationContext-application.xml",
  "classpath:org/globalgiving/spring/applicationContext-security-core.xml",
  "classpath:org/globalgiving/spring/applicationContext-ibatis.xml"
})
public class Application {

  /**
   * Main method.
   *
   * @param args the args
   */
  @Generated
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
